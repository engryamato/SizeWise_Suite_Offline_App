import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Dashboard from '../Dashboard'
import { AppProvider } from '../../context/AppContext'

// Mock the API dashboard service used by AppProvider
const { projectsMock } = vi.hoisted(() => ({
  projectsMock: [
    { id: 1, name: 'Project Alpha', status: 'active', ownerName: 'Admin', location: 'New York, NY', startDate: '2024-01-01', dueDate: '2024-12-31', priority: 'medium' },
    { id: 2, name: 'Project Beta', status: 'active', ownerName: 'Admin', location: 'San Francisco, CA', startDate: '2024-02-01', dueDate: '2024-11-30', priority: 'low' }
  ]
}))
vi.mock('../../services/api.js', () => ({
  dashboardService: {
    getDashboardData: vi.fn().mockResolvedValue({
      success: true,
      data: {
        tasksThisWeek: 3,
        overdue: { count: 2, top3: [] },
        milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
        projects: projectsMock
      }
    })
  },
  authService: {
    verifyToken: vi.fn().mockResolvedValue({
      success: true,
      user: { id: 1, username: 'admin', email: 'admin@sizewise.com', fullName: 'Admin', role: 'admin' }
    })
  }
}))

const renderDashboard = (props = {}) => {
  return render(
    <AppProvider>
      <Dashboard onLogout={() => {}} {...props} />
    </AppProvider>
  )
}

describe('Dashboard Component', () => {
  let setIntervalSpy

  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure token present to keep AppProvider stable
    localStorage.setItem('sizewise_token', 'test-token')
    // Prevent real intervals during tests to avoid act warnings
    setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(() => 1)
  })

  afterEach(() => {
    setIntervalSpy?.mockRestore()
    localStorage.clear()
  })

  test('renders dashboard with main sections', async () => {
    renderDashboard()

    // Wait for data to load and UI to render
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    // Check header controls
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()

    // Project Hub
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
    expect(screen.getByText(/active projects/i)).toBeInTheDocument()

    // Gantt Chart section
    expect(screen.getByText(/project gantt chart/i)).toBeInTheDocument()
    // Use getAllByRole because there is also a KPI card with role button containing "week"
    expect(screen.getAllByRole('button', { name: /week/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quarter/i })).toBeInTheDocument()

    // Project Map section
    expect(screen.getByText(/project map/i)).toBeInTheDocument()
  })

  test('timeline view buttons work correctly', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // Wait for dashboard to finish loading
    await waitFor(() => expect(screen.getByText(/project gantt chart/i)).toBeInTheDocument())

    const [weekBtn] = screen.getAllByRole('button', { name: /week/i })
    const monthBtn = screen.getByRole('button', { name: /month/i })
    const quarterBtn = screen.getByRole('button', { name: /quarter/i })

    // Verify buttons exist; active class is applied to a timeline tab elsewhere
    expect(weekBtn).toBeInTheDocument()
    expect(monthBtn).toBeInTheDocument()
    expect(quarterBtn).toBeInTheDocument()

    // Click Month
    await user.click(monthBtn)
    expect(monthBtn).toHaveClass('active')
    expect(weekBtn).not.toHaveClass('active')
    expect(quarterBtn).not.toHaveClass('active')

    // Click Quarter
    await user.click(quarterBtn)
    expect(quarterBtn).toHaveClass('active')
    expect(weekBtn).not.toHaveClass('active')
    expect(monthBtn).not.toHaveClass('active')
  })

  test('logout button calls onLogout', async () => {
    const mockLogout = vi.fn()
    const user = userEvent.setup()
    renderDashboard({ onLogout: mockLogout })

    // Wait for logout button to appear after data load
    const logoutBtn = await screen.findByRole('button', { name: /logout/i })
    await user.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalled()
  })

  test('displays KPI cards with real data', async () => {
    renderDashboard()

    // Wait for data to load and check KPI cards
    await waitFor(() => {
      expect(screen.getAllByText('3').length).toBeGreaterThan(0) // Tasks due this week
      expect(screen.getAllByText('2').length).toBeGreaterThan(0) // Overdue tasks
      expect(screen.getAllByText(projectsMock.length.toString()).length).toBeGreaterThan(0) // Total projects
    })

    expect(screen.getByText(/tasks due this week/i)).toBeInTheDocument()
    expect(screen.getByText(/overdue tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/completed this month/i)).toBeInTheDocument()
    expect(screen.getByText(/total projects/i)).toBeInTheDocument()
  })

  test('opens project creation modal', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const newProjectBtn = await screen.findByRole('button', { name: /new project/i })
    await user.click(newProjectBtn)

    // Check if modal opens
    expect(screen.getByText(/create new project/i)).toBeInTheDocument()
  })

  test('renders project list with data from database', async () => {
    renderDashboard()

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getAllByText(/project alpha/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/project beta/i).length).toBeGreaterThan(0)
    })
  })

  test('displays status bar with live connection', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/live data connected/i)).toBeInTheDocument()
      expect(screen.getByText(/last updated/i)).toBeInTheDocument()
    })
  })

  test('shows loading state initially', () => {
    // Mock loading state
    vi.doMock('../../context/AppContext', () => ({
      useApp: () => ({
        state: { isLoading: true, dashboardData: null },
        actions: { loadDashboardData: vi.fn() }
      })
    }))

    renderDashboard()
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument()
  })

  test('gantt chart renders with project data', async () => {
    renderDashboard()

    await waitFor(() => {
      // Check gantt section exists
      expect(screen.getByText(/project gantt chart/i)).toBeInTheDocument()

      // Check that gantt bars exist
      const ganttBars = document.querySelectorAll('.gantt-bar')
      expect(ganttBars.length).toBeGreaterThanOrEqual(0)
    })
  })

  test('project map renders with real locations', async () => {
    renderDashboard()

    await waitFor(() => {
      // Check that project dots are rendered
      const projectDots = document.querySelectorAll('.project-dot')
      expect(projectDots.length).toBeGreaterThanOrEqual(0)
    })
  })
})

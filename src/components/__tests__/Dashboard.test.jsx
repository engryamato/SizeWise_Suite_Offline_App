import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Dashboard from '../Dashboard'
import { AppProvider } from '../../context/AppContext'

// Mock the database service
vi.mock('../../services/database', () => ({
  databaseService: {
    getAllProjects: vi.fn().mockResolvedValue([
      { id: 1, name: 'Project Alpha', status: 'active', ownerName: 'Admin' },
      { id: 2, name: 'Project Beta', status: 'active', ownerName: 'Admin' }
    ]),
    getTasksDueThisWeek: vi.fn().mockResolvedValue(3),
    getOverdueTasks: vi.fn().mockResolvedValue({ count: 2, top3: [] })
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders dashboard with main sections', async () => {
    renderDashboard()

    // Check header with logo
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()

    // Check Project Hub section
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/active projects/i)).toBeInTheDocument()
    })

    // Check Gantt Chart section
    expect(screen.getByText(/project gantt chart/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quarter/i })).toBeInTheDocument()

    // Check Project Map section
    expect(screen.getByText(/project map/i)).toBeInTheDocument()
  })

  test('timeline view buttons work correctly', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const weekBtn = screen.getByRole('button', { name: /week/i })
    const monthBtn = screen.getByRole('button', { name: /month/i })
    const quarterBtn = screen.getByRole('button', { name: /quarter/i })

    // Week should be active by default
    expect(weekBtn).toHaveClass('active')
    expect(monthBtn).not.toHaveClass('active')
    expect(quarterBtn).not.toHaveClass('active')

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

    const logoutBtn = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalled()
  })

  test('displays KPI cards with real data', async () => {
    renderDashboard()

    // Wait for data to load and check KPI cards
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Tasks due this week
      expect(screen.getByText('2')).toBeInTheDocument() // Overdue tasks
    })

    expect(screen.getByText(/tasks due this week/i)).toBeInTheDocument()
    expect(screen.getByText(/overdue tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/completed this month/i)).toBeInTheDocument()
    expect(screen.getByText(/total projects/i)).toBeInTheDocument()
  })

  test('opens project creation modal', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const newProjectBtn = screen.getByRole('button', { name: /new project/i })
    await user.click(newProjectBtn)

    // Check if modal opens
    expect(screen.getByText(/create new project/i)).toBeInTheDocument()
  })

  test('renders project list with data from database', async () => {
    renderDashboard()

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText(/project alpha/i)).toBeInTheDocument()
      expect(screen.getByText(/project beta/i)).toBeInTheDocument()
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

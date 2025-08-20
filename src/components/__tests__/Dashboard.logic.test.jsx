import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'
import { AppProvider } from '../../context/AppContext'

// Mock the API dashboard service used by AppProvider
vi.mock('../../services/api.js', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
  },
  projectService: {
    create: vi.fn(),
  },
  authService: {
    verifyToken: vi.fn().mockResolvedValue({
      success: true,
      user: { id: 1, username: 'admin', email: 'admin@sizewise.com', fullName: 'Admin', role: 'admin' }
    })
  }
}))

// Use real localStorage for integration-like behavior

// Import mocked services
import { dashboardService, projectService } from '../../services/api.js'

describe('Dashboard Logic Tests', () => {
  let mockOnLogout
  let user

  beforeEach(() => {
    mockOnLogout = vi.fn()
    user = userEvent.setup()
    vi.clearAllMocks()

    // Real timers by default
    vi.useRealTimers()

    // Ensure a clean storage and a valid auth token
    localStorage.clear()
    localStorage.setItem('sizewise_token', 'test-token')

    // Mock dashboard service to return empty data initially
    dashboardService.getDashboardData.mockResolvedValue({
      success: true,
      data: {
        tasksThisWeek: 0,
        overdue: { count: 0, top3: [] },
        milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
        projects: []
      }
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    localStorage.clear()
  })

  describe('Fresh Database State', () => {
    it('should show zero counts when no projects exist', async () => {
      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Tasks Due This Week')).toBeInTheDocument()
      })

      // Should show zero for all KPIs
      const zeroes = screen.getAllByText('0')
      expect(zeroes.length).toBeGreaterThanOrEqual(3)

      // Status bar should show 0 projects
      expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      expect(screen.getAllByText(/0 Active/).length).toBeGreaterThan(0)
    })

    it('should show "Clear" status when no tasks are due', async () => {
      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('✅ Clear')).toBeInTheDocument()
      })
    })

    it('should show "All Clear" for overdue tasks when none exist', async () => {
      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('✅ All Clear')).toBeInTheDocument()
      })
    })
  })

  describe('After Creating First Project', () => {
    it('should update counts after creating a project', async () => {
      // Start with empty state
      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      // Verify initial empty state
      await waitFor(() => {
        expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      })

      // Mock successful project creation via API service
      const newProject = {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        status: 'active',
        priority: 'medium',
        location: 'New York, NY',
        ownerName: 'Admin',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }

      projectService.create.mockResolvedValue({ success: true, data: newProject })
      dashboardService.getDashboardData.mockResolvedValue({
        success: true,
        data: {
          tasksThisWeek: 0,
          overdue: { count: 0, top3: [] },
          milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
          projects: [newProject]
        }
      })

      // Click new project button
      const newProjectBtn = screen.getByText('+ New Project')
      await user.click(newProjectBtn)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument()
      })

      // Fill out the form
      await user.type(screen.getByPlaceholderText('Enter project name'), 'Test Project')
      await user.type(screen.getByPlaceholderText('Enter project description'), 'A test project')

      // Provide required dates
      const startDateInput = screen.getByLabelText(/start date/i)
      const dueDateInput = screen.getByLabelText(/due date/i)
      await user.type(startDateInput, newProject.startDate)
      await user.type(dueDateInput, newProject.dueDate)

      // Submit the form
      const createBtn = screen.getByRole('button', { name: /create project/i })
      await user.click(createBtn)

      // Should reflect in status bar counts
      await waitFor(() => {
        // Use regex with flexible matcher to account for markup
        const matches = screen.queryAllByText((content) => /1\s*Projects/i.test(content))
        expect(matches.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Data Consistency Logic', () => {
    it('should not show overdue tasks from fake seeded data', async () => {
      // Mock database with realistic current data
      const currentDate = new Date()
      const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      
      const realisticProject = {
        id: 1,
        name: 'Current Project',
        status: 'active',
        startDate: currentDate.toISOString().split('T')[0],
        dueDate: futureDate.toISOString().split('T')[0]
      }

      dashboardService.getDashboardData.mockResolvedValue({
        success: true,
        data: {
          tasksThisWeek: 0,
          overdue: { count: 0, top3: [] },
          milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
          projects: [realisticProject]
        }
      })

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // 1 total project
      })

      // Should not show any overdue tasks
      const overdueCards = screen.getAllByText('0')
      expect(overdueCards.length).toBeGreaterThan(0) // Should have overdue count of 0
      
      // Should show "All Clear" for overdue
      expect(screen.getByText('✅ All Clear')).toBeInTheDocument()
    })

    it('should calculate KPIs based on actual project data', async () => {
      const projects = [
        { id: 1, name: 'Active Project 1', status: 'active' },
        { id: 2, name: 'Active Project 2', status: 'active' },
        { id: 3, name: 'Completed Project', status: 'completed' }
      ]

      dashboardService.getDashboardData.mockResolvedValue({
        success: true,
        data: {
          tasksThisWeek: 2,
          overdue: { count: 1, top3: [{ id: 1, name: 'Late Task' }] },
          milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
          projects
        }
      })

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        // Should show correct project counts (status bar and badges)
        expect(screen.getAllByText(/3 Projects/).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/2 Active/).length).toBeGreaterThan(0)
      })

      // Should show correct KPI values
      expect(screen.getByText('2')).toBeInTheDocument() // Tasks due this week
      expect(screen.getByText('1')).toBeInTheDocument() // Overdue tasks
      expect(screen.getByText('3')).toBeInTheDocument() // Total projects
    })
  })

  describe('Database Initialization Logic', () => {
    it('should not seed fake data on fresh installation', async () => {
      // Mock fresh installation: clear storage and return empty dashboard
      localStorage.clear()
      dashboardService.getDashboardData.mockResolvedValue({
        success: true,
        data: {
          tasksThisWeek: 0,
          overdue: { count: 0, top3: [] },
          milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
          projects: []
        }
      })

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      // Should start with clean state
      await waitFor(() => {
        expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      })

      // Verify dashboard service was called
      expect(dashboardService.getDashboardData).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      // Mock dashboard error
      dashboardService.getDashboardData.mockResolvedValue({ success: false, error: 'Failed to fetch dashboard data' })

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      // Should handle errors gracefully and show default values
      await waitFor(() => {
        expect(screen.getByText('Tasks Due This Week')).toBeInTheDocument()
      })

      // Should show zero values as fallback
      const zeroElements = screen.getAllByText('0')
      expect(zeroElements.length).toBeGreaterThan(0)
    })
  })

  describe('Real-time Data Updates', () => {
    it('should reflect changes immediately after project creation', async () => {
      // Intercept setInterval to capture refresh callback
      let intervalCb = null
      const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn) => {
        intervalCb = fn
        return 1
      })

      // Start with empty state
      dashboardService.getDashboardData.mockResolvedValue({
        success: true,
        data: { tasksThisWeek: 0, overdue: { count: 0, top3: [] }, milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] }, projects: [] }
      })

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      })

      // Next refresh returns one project and keeps returning it
      const newProject = { id: 1, name: 'New Project', status: 'active' }
      dashboardService.getDashboardData.mockImplementation(() => Promise.resolve({ success: true, data: { tasksThisWeek: 0, overdue: { count: 0, top3: [] }, milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] }, projects: [newProject] } }))

      // Manually trigger captured interval callback to simulate auto-refresh
      await act(async () => {
        intervalCb && intervalCb()
      })

      // Wait for refreshed data to appear
      await waitFor(() => {
        const matches = screen.queryAllByText((content) => /1\s*Projects/i.test(content))
        expect(matches.length).toBeGreaterThan(0)
      })

      setIntervalSpy.mockRestore()
    })
  })
})

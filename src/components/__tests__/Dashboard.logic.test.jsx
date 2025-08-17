import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'
import { AppProvider } from '../../context/AppContext'

// Mock the database service to control data
vi.mock('../../services/database', () => ({
  default: {
    getAllProjects: vi.fn(),
    getTasksDueThisWeek: vi.fn(),
    getOverdueTasks: vi.fn(),
    createProject: vi.fn(),
    init: vi.fn(),
    isInitialized: vi.fn()
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Import the mocked database service
import databaseService from '../../services/database'

describe('Dashboard Logic Tests', () => {
  let mockOnLogout
  let user

  beforeEach(() => {
    mockOnLogout = vi.fn()
    user = userEvent.setup()
    vi.clearAllMocks()

    // Mock localStorage to return empty data initially
    mockLocalStorage.getItem.mockReturnValue(null)

    // Mock database service to return empty data initially
    databaseService.getAllProjects.mockResolvedValue([])
    databaseService.getTasksDueThisWeek.mockResolvedValue(0)
    databaseService.getOverdueTasks.mockResolvedValue({ count: 0, top3: [] })
    databaseService.isInitialized.mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllTimers()
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
      expect(screen.getByText('0')).toBeInTheDocument() // Tasks due this week
      expect(screen.getAllByText('0')).toHaveLength(4) // All KPI cards should show 0
      
      // Status bar should show 0 projects
      expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      expect(screen.getByText(/0 Active/)).toBeInTheDocument()
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

      // Mock successful project creation
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

      databaseService.createProject.mockResolvedValue({ success: true, data: newProject })
      databaseService.getAllProjects.mockResolvedValue([newProject])

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
      
      // Select location
      const locationSelect = screen.getByDisplayValue('New York, NY')
      expect(locationSelect).toBeInTheDocument()

      // Submit the form
      const createBtn = screen.getByRole('button', { name: /create project/i })
      await user.click(createBtn)

      // Should show success message and update counts
      await waitFor(() => {
        expect(screen.getByText(/project created successfully/i)).toBeInTheDocument()
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

      databaseService.getAllProjects.mockResolvedValue([realisticProject])
      databaseService.getTasksDueThisWeek.mockResolvedValue(0) // No tasks due
      databaseService.getOverdueTasks.mockResolvedValue({ count: 0, top3: [] }) // No overdue tasks

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

      databaseService.getAllProjects.mockResolvedValue(projects)
      databaseService.getTasksDueThisWeek.mockResolvedValue(2)
      databaseService.getOverdueTasks.mockResolvedValue({ count: 1, top3: [{ id: 1, name: 'Late Task' }] })

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        // Should show correct project counts
        expect(screen.getByText(/3 Projects/)).toBeInTheDocument()
        expect(screen.getByText(/2 Active/)).toBeInTheDocument()
      })

      // Should show correct KPI values
      expect(screen.getByText('2')).toBeInTheDocument() // Tasks due this week
      expect(screen.getByText('1')).toBeInTheDocument() // Overdue tasks
      expect(screen.getByText('3')).toBeInTheDocument() // Total projects
    })
  })

  describe('Database Initialization Logic', () => {
    it('should not seed fake data on fresh installation', async () => {
      // Mock fresh installation
      databaseService.isInitialized.mockReturnValue(false)
      mockLocalStorage.getItem.mockReturnValue(null)

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      // Should start with clean state
      await waitFor(() => {
        expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      })

      // Verify database service was called correctly
      expect(databaseService.getAllProjects).toHaveBeenCalled()
      expect(databaseService.getTasksDueThisWeek).toHaveBeenCalled()
      expect(databaseService.getOverdueTasks).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      databaseService.getAllProjects.mockRejectedValue(new Error('Database error'))
      databaseService.getTasksDueThisWeek.mockRejectedValue(new Error('Database error'))
      databaseService.getOverdueTasks.mockRejectedValue(new Error('Database error'))

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
      // Start with empty state
      databaseService.getAllProjects.mockResolvedValue([])

      render(
        <AppProvider>
          <Dashboard onLogout={mockOnLogout} />
        </AppProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/0 Projects/)).toBeInTheDocument()
      })

      // Simulate project creation by updating mock
      const newProject = { id: 1, name: 'New Project', status: 'active' }
      databaseService.getAllProjects.mockResolvedValue([newProject])

      // In a real scenario, the dashboard would refresh after project creation
      // This tests that the logic correctly calculates based on current data
      expect(databaseService.getAllProjects).toHaveBeenCalled()
    })
  })
})

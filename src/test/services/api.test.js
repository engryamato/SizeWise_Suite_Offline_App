import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService, projectService, dashboardService } from '../../services/api'

// Mock the database service
vi.mock('../../services/database', () => ({
  default: {
    findUserByCredentials: vi.fn(),
    createSession: vi.fn(),
    findValidSession: vi.fn(),
    getAllProjects: vi.fn(),
    createProject: vi.fn(),
    getTasksDueThisWeek: vi.fn(),
    getOverdueTasks: vi.fn()
  },
  databaseService: {
    findUserByCredentials: vi.fn(),
    createSession: vi.fn(),
    findValidSession: vi.fn(),
    getAllProjects: vi.fn(),
    createProject: vi.fn(),
    getTasksDueThisWeek: vi.fn(),
    getOverdueTasks: vi.fn()
  }
}))

// Import the mocked database service
import databaseService from '../../services/database'

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('authService', () => {
    describe('loginWithPin', () => {
      it('should login successfully with valid PIN', async () => {
        const mockUser = {
          id: 1,
          username: 'admin',
          email: 'admin@test.com',
          fullName: 'Admin User',
          role: 'admin'
        }

        databaseService.findUserByCredentials.mockResolvedValue(mockUser)
        databaseService.createSession.mockResolvedValue({})

        const result = await authService.loginWithPin('1234')

        expect(result.success).toBe(true)
        expect(result.user).toEqual(mockUser)
        expect(result.token).toBeTruthy()
        expect(databaseService.findUserByCredentials).toHaveBeenCalledWith('admin')
        expect(databaseService.createSession).toHaveBeenCalled()
      })

      it('should reject short PIN', async () => {
        const result = await authService.loginWithPin('123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('PIN must be at least 4 digits')
        expect(databaseService.findUserByCredentials).not.toHaveBeenCalled()
      })

      it('should handle database errors', async () => {
        databaseService.findUserByCredentials.mockRejectedValue(new Error('DB Error'))

        const result = await authService.loginWithPin('1234')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Authentication failed')
      })
    })

    describe('verifyToken', () => {
      it('should verify valid token', async () => {
        const mockUser = {
          id: 1,
          username: 'admin',
          email: 'admin@test.com',
          fullName: 'Admin User',
          role: 'admin'
        }

        databaseService.findValidSession.mockResolvedValue(mockUser)

        const result = await authService.verifyToken('valid-token')

        expect(result.success).toBe(true)
        expect(result.user).toEqual(mockUser)
      })

      it('should reject invalid token', async () => {
        databaseService.findValidSession.mockResolvedValue(null)

        const result = await authService.verifyToken('invalid-token')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid or expired token')
      })

      it('should reject empty token', async () => {
        const result = await authService.verifyToken('')

        expect(result.success).toBe(false)
        expect(result.error).toBe('No token provided')
        expect(databaseService.findValidSession).not.toHaveBeenCalled()
      })
    })

    describe('logout', () => {
      it('should logout successfully', async () => {
        const result = await authService.logout('some-token')

        expect(result.success).toBe(true)
      })
    })
  })

  describe('projectService', () => {
    describe('getAll', () => {
      it('should return all projects', async () => {
        const mockProjects = [
          { id: 1, name: 'Project 1', ownerName: 'Admin' },
          { id: 2, name: 'Project 2', ownerName: 'Admin' }
        ]

        databaseService.getAllProjects.mockResolvedValue(mockProjects)

        const result = await projectService.getAll()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockProjects)
      })

      it('should handle database errors', async () => {
        databaseService.getAllProjects.mockRejectedValue(new Error('DB Error'))

        const result = await projectService.getAll()

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to fetch projects')
      })
    })

    describe('create', () => {
      it('should create project with valid data', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'Test Description',
          ownerId: 1,
          startDate: '2024-01-01',
          dueDate: '2024-12-31'
        }

        const mockCreatedProject = { ...projectData, id: 1, ownerName: 'Admin' }
        databaseService.createProject.mockResolvedValue(mockCreatedProject)

        const result = await projectService.create(projectData)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockCreatedProject)
      })

      it('should reject invalid project data', async () => {
        const invalidData = {
          name: 'AB', // Too short
          ownerId: 1,
          startDate: '2024-01-01',
          dueDate: '2024-12-31'
        }

        const result = await projectService.create(invalidData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Validation failed')
        expect(result.details).toBeTruthy()
      })
    })
  })

  describe('dashboardService', () => {
    describe('getDashboardData', () => {
      it('should return comprehensive dashboard data', async () => {
        const mockProjects = [
          { id: 1, name: 'Project 1', status: 'active' },
          { id: 2, name: 'Project 2', status: 'completed' }
        ]
        const mockOverdue = { count: 2, top3: [] }

        databaseService.getTasksDueThisWeek.mockResolvedValue(5)
        databaseService.getOverdueTasks.mockResolvedValue(mockOverdue)
        databaseService.getAllProjects.mockResolvedValue(mockProjects)

        const result = await dashboardService.getDashboardData()

        expect(result.success).toBe(true)
        expect(result.data).toHaveProperty('tasksThisWeek', 5)
        expect(result.data).toHaveProperty('overdue', mockOverdue)
        expect(result.data).toHaveProperty('milestones')
        expect(result.data).toHaveProperty('projects')
        expect(result.data.projects).toHaveLength(2)
      })

      it('should handle database errors', async () => {
        databaseService.getTasksDueThisWeek.mockRejectedValue(new Error('DB Error'))

        const result = await dashboardService.getDashboardData()

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to fetch dashboard data')
      })
    })
  })
})

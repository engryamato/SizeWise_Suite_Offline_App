import { describe, it, expect, beforeEach, vi } from 'vitest'
import { databaseService } from '../../services/database'

describe('Database Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with sample data', () => {
      // Create new instance to trigger initialization
      const db = new (databaseService.constructor)()
      
      expect(db.initialized).toBe(true)
      expect(localStorage.getItem('sizewise_users')).toBeTruthy()
      expect(localStorage.getItem('sizewise_projects')).toBeTruthy()
      expect(localStorage.getItem('sizewise_tasks')).toBeTruthy()
    })

    it('should not reinitialize if data exists', () => {
      // Set some data first
      localStorage.setItem('sizewise_users', JSON.stringify([{ id: 1 }]))
      
      const db = new (databaseService.constructor)()
      
      expect(db.initialized).toBe(true)
      const users = JSON.parse(localStorage.getItem('sizewise_users'))
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(1)
    })
  })

  describe('user operations', () => {
    beforeEach(() => {
      // Initialize with fresh data
      databaseService.init()
    })

    it('should find user by credentials', async () => {
      const user = await databaseService.findUserByCredentials('admin')
      
      expect(user).toBeTruthy()
      expect(user.username).toBe('admin')
      expect(user.isActive).toBe(true)
    })

    it('should return null for non-existent user', async () => {
      const user = await databaseService.findUserByCredentials('nonexistent')
      
      expect(user).toBeUndefined()
    })
  })

  describe('project operations', () => {
    beforeEach(() => {
      databaseService.init()
    })

    it('should get all projects with owner names', async () => {
      const projects = await databaseService.getAllProjects()

      // Current seed uses no projects by default
      expect(Array.isArray(projects)).toBe(true)
      if (projects.length > 0) {
        expect(projects[0]).toHaveProperty('ownerName')
      }
    })

    it('should create new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        ownerId: 1,
        location: 'Test Location',
        startDate: '2024-01-01',
        dueDate: '2024-12-31',
        priority: 'high'
      }

      const result = await databaseService.createProject(projectData)
      
      expect(result).toHaveProperty('id')
      expect(result.name).toBe('Test Project')
      expect(result.ownerName).toBe('System Administrator')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
    })
  })

  describe('task operations', () => {
    beforeEach(() => {
      databaseService.init()
      // Mock current date to a specific date for consistent testing
      vi.setSystemTime(new Date('2024-02-15T10:00:00Z'))
    })

    it('should count tasks due this week', async () => {
      const count = await databaseService.getTasksDueThisWeek()
      
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should get overdue tasks with project names', async () => {
      const result = await databaseService.getOverdueTasks()
      
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('top3')
      expect(Array.isArray(result.top3)).toBe(true)
      
      if (result.top3.length > 0) {
        expect(result.top3[0]).toHaveProperty('name')
        expect(result.top3[0]).toHaveProperty('projectName')
        expect(result.top3[0]).toHaveProperty('daysLate')
      }
    })
  })

  describe('session operations', () => {
    beforeEach(() => {
      databaseService.init()
    })

    it('should create and find valid session', async () => {
      const userId = 1
      const token = 'test-token'
      const expiresAt = new Date(Date.now() + 60000).toISOString() // 1 minute from now

      await databaseService.createSession(userId, token, expiresAt)
      const user = await databaseService.findValidSession(token)
      
      expect(user).toBeTruthy()
      expect(user.id).toBe(userId)
    })

    it('should not find expired session', async () => {
      const userId = 1
      const token = 'expired-token'
      const expiresAt = new Date(Date.now() - 60000).toISOString() // 1 minute ago

      await databaseService.createSession(userId, token, expiresAt)
      const user = await databaseService.findValidSession(token)
      
      expect(user).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Trigger an error in setItem via circular JSON to ensure catch branch
      const obj = {}
      obj.self = obj // circular reference causes JSON.stringify to throw

      expect(() => databaseService.setItem('test', obj)).toThrow('Storage operation failed')
    })

    it('should handle JSON parse errors gracefully', () => {
      // Set invalid JSON
      localStorage.setItem('sizewise_users', 'invalid json')
      
      const result = databaseService.getItem('sizewise_users')
      expect(result).toEqual([])
    })
  })
})

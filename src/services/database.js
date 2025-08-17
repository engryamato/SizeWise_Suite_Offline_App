import { STORAGE_KEYS, PROJECT_STATUS, TASK_STATUS, USER_ROLES } from '../constants'
import { getCurrentWeekRange, isOverdue, daysBetween } from '../utils/dateUtils'

/**
 * Database service for browser storage operations
 */
class DatabaseService {
  constructor() {
    this.initialized = false
    this.init()
  }

  /**
   * Initialize database with sample data
   */
  init() {
    try {
      if (this.isInitialized()) {
        this.initialized = true
        return
      }

      this.seedInitialData()
      this.initialized = true
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw new Error('Failed to initialize database')
    }
  }

  /**
   * Check if database is already initialized
   */
  isInitialized() {
    return localStorage.getItem(STORAGE_KEYS.USERS) !== null
  }

  /**
   * Seed database with initial data
   */
  seedInitialData() {
    const users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@sizewise.com',
        passwordHash: 'admin123',
        fullName: 'System Administrator',
        role: USER_ROLES.ADMIN,
        createdAt: new Date().toISOString(),
        isActive: true
      }
    ]

    const projects = [
      {
        id: 1,
        name: 'Project Alpha',
        description: 'Strategic development initiative for Q1',
        ownerId: 1,
        location: 'New York, NY',
        startDate: '2024-01-15',
        dueDate: '2024-06-30',
        priority: 'high',
        status: PROJECT_STATUS.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Project Beta',
        description: 'Customer experience enhancement program',
        ownerId: 1,
        location: 'San Francisco, CA',
        startDate: '2024-02-01',
        dueDate: '2024-05-15',
        priority: 'medium',
        status: PROJECT_STATUS.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Project Gamma',
        description: 'Infrastructure modernization project',
        ownerId: 1,
        location: 'Austin, TX',
        startDate: '2024-03-01',
        dueDate: '2024-08-30',
        priority: 'high',
        status: PROJECT_STATUS.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Project Delta',
        description: 'Market research and analysis',
        ownerId: 1,
        location: 'Chicago, IL',
        startDate: '2023-12-01',
        dueDate: '2024-02-28',
        priority: 'low',
        status: PROJECT_STATUS.COMPLETED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const tasks = [
      {
        id: 1,
        projectId: 1,
        title: 'Requirements gathering',
        description: 'Collect and document project requirements',
        assigneeId: 1,
        status: TASK_STATUS.COMPLETED,
        priority: 'high',
        dueDate: '2024-01-30',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        projectId: 1,
        title: 'Design mockups',
        description: 'Create initial design concepts',
        assigneeId: 1,
        status: TASK_STATUS.IN_PROGRESS,
        priority: 'medium',
        dueDate: '2024-02-15',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        projectId: 2,
        title: 'User research',
        description: 'Conduct user interviews and surveys',
        assigneeId: 1,
        status: TASK_STATUS.PENDING,
        priority: 'high',
        dueDate: '2024-01-20',
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        projectId: 3,
        title: 'Infrastructure audit',
        description: 'Review current infrastructure',
        assigneeId: 1,
        status: TASK_STATUS.PENDING,
        priority: 'high',
        dueDate: '2024-01-25',
        createdAt: new Date().toISOString()
      }
    ]

    this.setItem(STORAGE_KEYS.USERS, users)
    this.setItem(STORAGE_KEYS.PROJECTS, projects)
    this.setItem(STORAGE_KEYS.TASKS, tasks)
    this.setItem(STORAGE_KEYS.SESSIONS, [])
  }

  /**
   * Safe localStorage operations with error handling
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : []
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error)
      return []
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error)
      throw new Error('Storage operation failed')
    }
  }

  /**
   * User operations
   */
  async findUserByCredentials(username) {
    try {
      const users = this.getItem(STORAGE_KEYS.USERS)
      return users.find(user => user.username === username && user.isActive)
    } catch (error) {
      console.error('Error finding user:', error)
      throw new Error('User lookup failed')
    }
  }

  /**
   * Project operations
   */
  async getAllProjects() {
    try {
      const projects = this.getItem(STORAGE_KEYS.PROJECTS)
      const users = this.getItem(STORAGE_KEYS.USERS)
      
      return projects.map(project => {
        const owner = users.find(user => user.id === project.ownerId)
        return {
          ...project,
          ownerName: owner ? owner.fullName : 'Unknown User'
        }
      })
    } catch (error) {
      console.error('Error getting projects:', error)
      throw new Error('Failed to retrieve projects')
    }
  }

  async createProject(projectData) {
    try {
      const projects = this.getItem(STORAGE_KEYS.PROJECTS)
      const users = this.getItem(STORAGE_KEYS.USERS)
      
      const newId = Math.max(...projects.map(p => p.id), 0) + 1
      const newProject = {
        ...projectData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      projects.push(newProject)
      this.setItem(STORAGE_KEYS.PROJECTS, projects)
      
      const owner = users.find(user => user.id === projectData.ownerId)
      return {
        ...newProject,
        ownerName: owner ? owner.fullName : 'Unknown User'
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw new Error('Failed to create project')
    }
  }

  /**
   * Task operations
   */
  async getTasksDueThisWeek() {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS)
      const { startOfWeek, endOfWeek } = getCurrentWeekRange()
      
      const tasksThisWeek = tasks.filter(task => {
        if (task.status === TASK_STATUS.COMPLETED || !task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= startOfWeek && dueDate <= endOfWeek
      })
      
      return tasksThisWeek.length
    } catch (error) {
      console.error('Error getting tasks due this week:', error)
      throw new Error('Failed to retrieve weekly tasks')
    }
  }

  async getOverdueTasks() {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS)
      const projects = this.getItem(STORAGE_KEYS.PROJECTS)
      
      const overdueTasks = tasks.filter(task => {
        return task.status !== TASK_STATUS.COMPLETED && 
               task.dueDate && 
               isOverdue(task.dueDate)
      })
      
      const top3 = overdueTasks.slice(0, 3).map(task => {
        const project = projects.find(p => p.id === task.projectId)
        const daysLate = daysBetween(new Date(), task.dueDate)
        return {
          id: task.id,
          name: task.title,
          projectId: task.projectId,
          projectName: project ? project.name : 'Unknown Project',
          daysLate
        }
      })
      
      return {
        count: overdueTasks.length,
        top3
      }
    } catch (error) {
      console.error('Error getting overdue tasks:', error)
      throw new Error('Failed to retrieve overdue tasks')
    }
  }

  /**
   * Session operations
   */
  async createSession(userId, token, expiresAt) {
    try {
      const sessions = this.getItem(STORAGE_KEYS.SESSIONS)
      const session = { 
        userId, 
        token, 
        expiresAt, 
        createdAt: new Date().toISOString() 
      }
      sessions.push(session)
      this.setItem(STORAGE_KEYS.SESSIONS, sessions)
      return session
    } catch (error) {
      console.error('Error creating session:', error)
      throw new Error('Failed to create session')
    }
  }

  async findValidSession(token) {
    try {
      const sessions = this.getItem(STORAGE_KEYS.SESSIONS)
      const users = this.getItem(STORAGE_KEYS.USERS)
      
      const session = sessions.find(s => 
        s.token === token && 
        new Date(s.expiresAt) > new Date()
      )
      
      if (session) {
        return users.find(user => user.id === session.userId && user.isActive)
      }
      return null
    } catch (error) {
      console.error('Error finding session:', error)
      throw new Error('Session lookup failed')
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()
export default databaseService

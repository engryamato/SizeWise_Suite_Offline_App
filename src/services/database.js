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
   * Reset database to clean state (for development/testing)
   */
  reset() {
    localStorage.removeItem(STORAGE_KEYS.USERS)
    localStorage.removeItem(STORAGE_KEYS.PROJECTS)
    localStorage.removeItem(STORAGE_KEYS.TASKS)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    this.initialized = false
    this.init()
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

    // Start with empty projects - no fake seeded data
    const projects = []

    // Start with empty tasks - no fake seeded data
    const tasks = []

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
      const projects = this.getItem(STORAGE_KEYS.PROJECTS) || []
      const users = this.getItem(STORAGE_KEYS.USERS) || []

      if (!Array.isArray(projects)) {
        return []
      }

      return projects.map(project => {
        if (!project) {
          return {
            id: 'unknown',
            name: 'Invalid Project',
            ownerName: 'Unknown User'
          }
        }

        const owner = users.find(user => user && user.id === project.ownerId)
        return {
          ...project,
          ownerName: owner ? owner.fullName : 'Unknown User'
        }
      })
    } catch (error) {
      console.error('Error getting projects:', error)
      return [] // Return empty array instead of throwing
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

  async updateProject(projectId, updateData) {
    try {
      const projects = this.getItem(STORAGE_KEYS.PROJECTS)
      const users = this.getItem(STORAGE_KEYS.USERS)
      const projectIndex = projects.findIndex(p => p.id === projectId)

      if (projectIndex === -1) {
        throw new Error('Project not found')
      }

      const updatedProject = {
        ...projects[projectIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      }

      projects[projectIndex] = updatedProject
      this.setItem(STORAGE_KEYS.PROJECTS, projects)

      const owner = users.find(user => user.id === updatedProject.ownerId)
      return {
        ...updatedProject,
        ownerName: owner ? owner.fullName : 'Unknown User'
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw new Error('Failed to update project')
    }
  }

  async deleteProject(projectId) {
    try {
      const projects = this.getItem(STORAGE_KEYS.PROJECTS)
      const projectIndex = projects.findIndex(p => p.id === projectId)

      if (projectIndex === -1) {
        throw new Error('Project not found')
      }

      const deletedProject = projects[projectIndex]
      projects.splice(projectIndex, 1)
      this.setItem(STORAGE_KEYS.PROJECTS, projects)

      // Also delete associated tasks
      const tasks = this.getItem(STORAGE_KEYS.TASKS)
      const updatedTasks = tasks.filter(t => t.projectId !== projectId)
      this.setItem(STORAGE_KEYS.TASKS, updatedTasks)

      return deletedProject
    } catch (error) {
      console.error('Error deleting project:', error)
      throw new Error('Failed to delete project')
    }
  }

  /**
   * Task operations
   */
  async getTasksDueThisWeek() {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return 0
      }

      const { startOfWeek, endOfWeek } = getCurrentWeekRange()

      const tasksThisWeek = tasks.filter(task => {
        if (!task || task.status === TASK_STATUS.COMPLETED || !task.dueDate) return false
        try {
          const dueDate = new Date(task.dueDate)
          return dueDate >= startOfWeek && dueDate <= endOfWeek
        } catch (dateError) {
          console.warn('Invalid date in task:', task.dueDate)
          return false
        }
      })

      return tasksThisWeek.length
    } catch (error) {
      console.error('Error getting tasks due this week:', error)
      return 0 // Return 0 instead of throwing
    }
  }

  async getOverdueTasks() {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []
      const projects = this.getItem(STORAGE_KEYS.PROJECTS) || []

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
          count: 0,
          top3: []
        }
      }

      const overdueTasks = tasks.filter(task => {
        if (!task || !task.dueDate) return false
        try {
          return task.status !== TASK_STATUS.COMPLETED && isOverdue(task.dueDate)
        } catch (dateError) {
          console.warn('Invalid date in overdue task:', task.dueDate)
          return false
        }
      })

      const top3 = overdueTasks.slice(0, 3).map(task => {
        const project = projects.find(p => p.id === task.projectId)
        try {
          const daysLate = daysBetween(new Date(), task.dueDate)
          return {
            id: task.id,
            name: task.title || task.name || 'Unnamed Task',
            projectId: task.projectId,
            projectName: project ? project.name : 'Unknown Project',
            daysLate
          }
        } catch (error) {
          console.warn('Error processing overdue task:', task)
          return {
            id: task.id,
            name: 'Invalid Task',
            projectId: task.projectId,
            projectName: 'Unknown Project',
            daysLate: 0
          }
        }
      })

      return {
        count: overdueTasks.length,
        top3
      }
    } catch (error) {
      console.error('Error getting overdue tasks:', error)
      return {
        count: 0,
        top3: []
      }
    }
  }

  /**
   * Task CRUD operations
   */
  async getAllTasks() {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []
      const projects = this.getItem(STORAGE_KEYS.PROJECTS) || []
      const users = this.getItem(STORAGE_KEYS.USERS) || []

      return tasks.map(task => {
        const project = projects.find(p => p.id === task.projectId)
        const assignee = users.find(u => u.id === task.assigneeId)
        return {
          ...task,
          projectName: project ? project.name : 'Unknown Project',
          assigneeName: assignee ? assignee.fullName : 'Unassigned'
        }
      })
    } catch (error) {
      console.error('Error getting tasks:', error)
      return []
    }
  }

  async getTasksByProject(projectId) {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []
      const users = this.getItem(STORAGE_KEYS.USERS) || []

      const projectTasks = tasks.filter(task => task.projectId === projectId)

      return projectTasks.map(task => {
        const assignee = users.find(u => u.id === task.assigneeId)
        return {
          ...task,
          assigneeName: assignee ? assignee.fullName : 'Unassigned'
        }
      })
    } catch (error) {
      console.error('Error getting project tasks:', error)
      return []
    }
  }

  async createTask(taskData) {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []

      const newId = Math.max(...tasks.map(t => t.id), 0) + 1
      const newTask = {
        id: newId,
        ...taskData,
        status: taskData.status || TASK_STATUS.TODO,
        priority: taskData.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      tasks.push(newTask)
      this.setItem(STORAGE_KEYS.TASKS, tasks)

      return newTask
    } catch (error) {
      console.error('Error creating task:', error)
      throw new Error('Failed to create task')
    }
  }

  async updateTask(taskId, updateData) {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex === -1) {
        throw new Error('Task not found')
      }

      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      }

      this.setItem(STORAGE_KEYS.TASKS, tasks)
      return tasks[taskIndex]
    } catch (error) {
      console.error('Error updating task:', error)
      throw new Error('Failed to update task')
    }
  }

  async deleteTask(taskId) {
    try {
      const tasks = this.getItem(STORAGE_KEYS.TASKS) || []
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex === -1) {
        throw new Error('Task not found')
      }

      const deletedTask = tasks[taskIndex]
      tasks.splice(taskIndex, 1)
      this.setItem(STORAGE_KEYS.TASKS, tasks)

      return deletedTask
    } catch (error) {
      console.error('Error deleting task:', error)
      throw new Error('Failed to delete task')
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

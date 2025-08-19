import databaseService from './database.js'
import { validateProject } from '../../app/tools/estimating-app/validators/project.js'
import { validateTask } from '../../app/tools/estimating-app/validators/task.js'
import { validatePin } from '../utils/validation.js'
import { APP_CONFIG, STORAGE_KEYS } from '../constants/index.js'

/**
 * Generates a secure token for authentication
 * @returns {string} - Generated token
 */
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Login with PIN
   * @param {string} pin - User PIN
   * @returns {Promise<Object>} - Login result
   */
  async loginWithPin(pin) {
    try {
      const validation = validatePin(pin)
      if (!validation.isValid) {
        return { success: false, error: validation.errors.pin }
      }

      // Check if PIN exists in registered PINs
      const storedPins = JSON.parse(localStorage.getItem('sizewise_pins') || '[]')
      const validPin = storedPins.find(p => p.pin === pin && p.isActive)

      if (!validPin) {
        // Fallback: For demo purposes, any 4+ digit PIN logs in as admin if no PINs are registered
        if (storedPins.length === 0) {
          console.log('No PINs registered, using demo mode')
        } else {
          return { success: false, error: 'Invalid PIN' }
        }
      }

      const user = await databaseService.findUserByCredentials('admin')
      if (user) {
        const token = generateToken()
        const expiresAt = new Date(Date.now() + APP_CONFIG.SESSION_TIMEOUT).toISOString()

        await databaseService.createSession(user.id, token, expiresAt)

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          },
          token
        }
      }

      return { success: false, error: 'Invalid credentials' }
    } catch (error) {
      return { success: false, error: 'Authentication failed' }
    }
  },

  /**
   * Verify authentication token
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - Verification result
   */
  async verifyToken(token) {
    try {
      if (!token) {
        return { success: false, error: 'No token provided' }
      }

      const user = await databaseService.findValidSession(token)
      if (user) {
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        }
      }
      return { success: false, error: 'Invalid or expired token' }
    } catch (error) {
      return { success: false, error: 'Token verification failed' }
    }
  },

  /**
   * Logout user
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - Logout result
   */
  async logout(token) {
    try {
      // Clear token from localStorage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Logout failed' }
    }
  }
}

/**
 * Project service
 */
export const projectService = {
  /**
   * Get all projects
   * @returns {Promise<Object>} - Projects result
   */
  async getAll() {
    try {
      const projects = await databaseService.getAllProjects()
      return { success: true, data: projects }
    } catch (error) {
      return { success: false, error: 'Failed to fetch projects' }
    }
  },

  /**
   * Get project by ID
   * @param {number} id - Project ID
   * @returns {Promise<Object>} - Project result
   */
  async getById(id) {
    try {
      const projects = await databaseService.getAllProjects()
      const project = projects.find(p => p.id === parseInt(id))
      if (project) {
        return { success: true, data: project }
      }
      return { success: false, error: 'Project not found' }
    } catch (error) {
      return { success: false, error: 'Failed to fetch project' }
    }
  },

  /**
   * Create new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} - Creation result
   */
  async create(projectData) {
    try {
      // Validate project data
      const validation = validateProject(projectData)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        }
      }

      const project = await databaseService.createProject({
        ...projectData,
        priority: projectData.priority || 'medium',
        status: 'active'
      })

      return { success: true, data: project }
    } catch (error) {
      return { success: false, error: 'Failed to create project' }
    }
  },

  /**
   * Update project
   * @param {number} id - Project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise<Object>} - Update result
   */
  async update(id, projectData) {
    try {
      // Validate project data
      const validation = validateProject(projectData)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        }
      }

      const project = await databaseService.updateProject(id, projectData)
      return { success: true, data: project }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update project' }
    }
  },

  /**
   * Delete project
   * @param {number} id - Project ID
   * @returns {Promise<Object>} - Deletion result
   */
  async delete(id) {
    try {
      if (!id || typeof id !== 'number') {
        return { success: false, error: 'Invalid project ID' }
      }

      const deletedProject = await databaseService.deleteProject(id)
      return { success: true, data: deletedProject }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to delete project' }
    }
  }
}

/**
 * Task service for task management
 */
export const taskService = {
  /**
   * Get all tasks
   */
  async getAll() {
    try {
      const tasks = await databaseService.getAllTasks()
      return { success: true, data: tasks }
    } catch (error) {
      return { success: false, error: 'Failed to fetch tasks' }
    }
  },

  /**
   * Get tasks by project
   */
  async getByProject(projectId) {
    try {
      const tasks = await databaseService.getTasksByProject(projectId)
      return { success: true, data: tasks }
    } catch (error) {
      return { success: false, error: 'Failed to fetch project tasks' }
    }
  },

  /**
   * Create new task
   */
  async create(taskData) {
    try {
      const validation = validateTask(taskData)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        }
      }

      const task = await databaseService.createTask(taskData)
      return { success: true, data: task }
    } catch (error) {
      return { success: false, error: 'Failed to create task' }
    }
  },

  /**
   * Update task
   */
  async update(taskId, taskData) {
    try {
      const validation = validateTask(taskData)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        }
      }

      const task = await databaseService.updateTask(taskId, taskData)
      return { success: true, data: task }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update task' }
    }
  },

  /**
   * Delete task
   */
  async delete(taskId) {
    try {
      const deletedTask = await databaseService.deleteTask(taskId)
      return { success: true, data: deletedTask }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to delete task' }
    }
  }
}

/**
 * Dashboard service
 */
export const dashboardService = {
  /**
   * Get comprehensive dashboard data
   * @returns {Promise<Object>} - Dashboard data result
   */
  async getDashboardData() {
    try {
      // Get all data in parallel for better performance
      const [tasksThisWeek, overdueData, projects] = await Promise.all([
        databaseService.getTasksDueThisWeek(),
        databaseService.getOverdueTasks(),
        databaseService.getAllProjects()
      ])

      // Calculate milestone data
      const milestones = {
        wonThisMonth: projects.filter(p => p.status === 'won').length,
        finishedThisMonth: projects.filter(p => p.status === 'completed').length,
        recent: projects
          .filter(p => p.status === 'won' || p.status === 'completed')
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            name: p.name,
            type: p.status,
            date: p.updatedAt
          }))
      }

      // Format projects for dashboard
      const formattedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        location: p.location,
        ownerName: p.ownerName,
        startDate: p.startDate,
        dueDate: p.dueDate,
        updatedAt: p.updatedAt
      }))

      return {
        success: true,
        data: {
          tasksThisWeek,
          overdue: overdueData,
          milestones,
          projects: formattedProjects
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch dashboard data' }
    }
  }
}

// Clean expired sessions periodically
setInterval(() => {
  // In a real application, this would clean expired sessions
  // For demo purposes, we'll skip this
}, APP_CONFIG.AUTO_REFRESH_INTERVAL)

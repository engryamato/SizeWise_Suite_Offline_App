// Application Constants

export const APP_CONFIG = {
  NAME: 'SizeWise Suite',
  VERSION: '1.0.0',
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
}

export const STORAGE_KEYS = {
  USERS: 'sizewise_users',
  PROJECTS: 'sizewise_projects',
  TASKS: 'sizewise_tasks',
  SESSIONS: 'sizewise_sessions',
  AUTH_TOKEN: 'sizewise_token',
}

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PLANNING: 'planning',
  ON_HOLD: 'on-hold',
  ARCHIVED: 'archived',
  WON: 'won',
}

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
}

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
}

export const PROJECT_LOCATIONS = {
  'New York, NY': { x: 75, y: 40 },
  'San Francisco, CA': { x: 15, y: 45 },
  'Austin, TX': { x: 50, y: 60 },
  'Chicago, IL': { x: 65, y: 35 },
  'Seattle, WA': { x: 20, y: 25 },
  'Boston, MA': { x: 80, y: 30 },
}

export const VALIDATION_RULES = {
  PROJECT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 120,
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
  PIN: {
    MIN_LENGTH: 4,
  },
}

import { VALIDATION_RULES } from '../constants'

/**
 * Validates project data
 * @param {Object} projectData - Project data to validate
 * @returns {Object} - Validation result with errors
 */
export function validateProject(projectData) {
  const errors = {}

  // Project name validation
  if (!projectData.name || !projectData.name.trim()) {
    errors.name = 'Project name is required'
  } else if (projectData.name.trim().length < VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH) {
    errors.name = `Project name must be at least ${VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH} characters`
  } else if (projectData.name.trim().length > VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH) {
    errors.name = `Project name must be less than ${VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH} characters`
  }

  // Description validation
  if (projectData.description && projectData.description.length > VALIDATION_RULES.DESCRIPTION.MAX_LENGTH) {
    errors.description = `Description must be less than ${VALIDATION_RULES.DESCRIPTION.MAX_LENGTH} characters`
  }

  // Start date validation
  if (!projectData.startDate) {
    errors.startDate = 'Start date is required'
  }

  // Due date validation
  if (!projectData.dueDate) {
    errors.dueDate = 'Due date is required'
  }

  // Date comparison validation
  if (projectData.startDate && projectData.dueDate) {
    if (new Date(projectData.dueDate) <= new Date(projectData.startDate)) {
      errors.dueDate = 'Due date must be after start date'
    }
  }

  // Owner validation
  if (!projectData.ownerId) {
    errors.ownerId = 'Project owner is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validates PIN input
 * @param {string} pin - PIN to validate
 * @returns {Object} - Validation result
 */
export function validatePin(pin) {
  const errors = {}

  if (!pin || pin.length < VALIDATION_RULES.PIN.MIN_LENGTH) {
    errors.pin = `PIN must be at least ${VALIDATION_RULES.PIN.MIN_LENGTH} digits`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitizes user input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  return input.trim().replace(/[<>]/g, '')
}

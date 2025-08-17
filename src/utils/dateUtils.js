/**
 * Gets the start and end of the current week (Monday to Sunday)
 * @returns {Object} - Start and end dates of the week
 */
export function getCurrentWeekRange() {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
  endOfWeek.setHours(23, 59, 59, 999)

  return { startOfWeek, endOfWeek }
}

/**
 * Gets the start and end of the current month
 * @returns {Object} - Start and end dates of the month
 */
export function getCurrentMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  return { startOfMonth, endOfMonth }
}

/**
 * Calculates days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} - Number of days between dates
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const timeDiff = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Checks if a date is overdue (before today)
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is overdue
 */
export function isOverdue(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

/**
 * Checks if a date is within the current week
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is within current week
 */
export function isWithinCurrentWeek(date) {
  const { startOfWeek, endOfWeek } = getCurrentWeekRange()
  const checkDate = new Date(date)
  return checkDate >= startOfWeek && checkDate <= endOfWeek
}

/**
 * Formats a date for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  const d = new Date(date)
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  return d.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Formats a date and time for display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date and time string
 */
export function formatDateTime(date) {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

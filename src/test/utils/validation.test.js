import { describe, it, expect } from 'vitest'
import { validateProject, validatePin, sanitizeInput } from '../../utils/validation'

describe('Validation Utils', () => {
  describe('validateProject', () => {
    it('should validate a valid project', () => {
      const validProject = {
        name: 'Test Project',
        description: 'A test project',
        ownerId: 1,
        startDate: '2024-01-01',
        dueDate: '2024-12-31'
      }

      const result = validateProject(validProject)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject project with missing name', () => {
      const invalidProject = {
        ownerId: 1,
        startDate: '2024-01-01',
        dueDate: '2024-12-31'
      }

      const result = validateProject(invalidProject)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Project name is required')
    })

    it('should reject project with short name', () => {
      const invalidProject = {
        name: 'AB',
        ownerId: 1,
        startDate: '2024-01-01',
        dueDate: '2024-12-31'
      }

      const result = validateProject(invalidProject)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Project name must be at least 3 characters')
    })

    it('should reject project with long name', () => {
      const invalidProject = {
        name: 'A'.repeat(121),
        ownerId: 1,
        startDate: '2024-01-01',
        dueDate: '2024-12-31'
      }

      const result = validateProject(invalidProject)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Project name must be less than 120 characters')
    })

    it('should reject project with due date before start date', () => {
      const invalidProject = {
        name: 'Test Project',
        ownerId: 1,
        startDate: '2024-12-31',
        dueDate: '2024-01-01'
      }

      const result = validateProject(invalidProject)
      expect(result.isValid).toBe(false)
      expect(result.errors.dueDate).toBe('Due date must be after start date')
    })

    it('should reject project with missing owner', () => {
      const invalidProject = {
        name: 'Test Project',
        startDate: '2024-01-01',
        dueDate: '2024-12-31'
      }

      const result = validateProject(invalidProject)
      expect(result.isValid).toBe(false)
      expect(result.errors.ownerId).toBe('Project owner is required')
    })
  })

  describe('validatePin', () => {
    it('should validate a valid PIN', () => {
      const result = validatePin('1234')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject short PIN', () => {
      const result = validatePin('123')
      expect(result.isValid).toBe(false)
      expect(result.errors.pin).toBe('PIN must be at least 4 digits')
    })

    it('should reject empty PIN', () => {
      const result = validatePin('')
      expect(result.isValid).toBe(false)
      expect(result.errors.pin).toBe('PIN must be at least 4 digits')
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
    })

    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('should handle non-string input', () => {
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
      expect(sanitizeInput(123)).toBe('')
    })
  })
})

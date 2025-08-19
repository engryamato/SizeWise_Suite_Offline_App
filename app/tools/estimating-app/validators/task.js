import { z } from 'zod';

// Zod schema mirroring task.schema.json
export const taskSchema = z.object({
  title: z.string().min(1).max(255),
  projectId: z.number(),
  description: z.string().max(2000).nullish(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  startDate: z.string().nullish(),
  dueDate: z.string().nullish()
}).strict();

/**
 * Validate task data against schema
 * @param {unknown} data
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validateTask(data) {
  const result = taskSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  const errors = result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message
  }));
  return { valid: false, errors };
}

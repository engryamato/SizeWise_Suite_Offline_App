import { z } from 'zod';

// Zod schema mirroring project.schema.json
export const projectSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(2000).nullish(),
  location: z.string().max(255).nullish(),
  startDate: z.string(),
  dueDate: z.string(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).default([]),
  ownerId: z.number(),
  status: z.string().optional()
}).strict();

/**
 * Validate project data against schema
 * @param {unknown} data
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validateProject(data) {
  const result = projectSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  const errors = result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message
  }));
  return { valid: false, errors };
}

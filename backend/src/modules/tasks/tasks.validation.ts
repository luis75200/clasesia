import { z } from 'zod';

const statusEnum = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const listTasksQuerySchema = z
  .object({
    skip: z.coerce.number().int().min(0).max(1000000).default(0),
    take: z.coerce.number().int().min(1).max(500).default(50),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignee_id: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(100).optional(),
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.from_date && value.to_date) {
      const from = new Date(value.from_date);
      const to = new Date(value.to_date);
      if (from > to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'from_date debe ser menor o igual a to_date',
          path: ['from_date'],
        });
      }
    }
  });

export const createTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(10000).nullable().optional(),
    priority: priorityEnum,
    project_id: z.string().uuid().nullable().optional(),
    assignees: z.array(z.string().uuid()).max(25).default([]),
    labels: z.array(z.string().trim().min(1).max(100)).max(25).default([]),
  })
  .strict();

export const assignProjectBodySchema = z
  .object({
    project_id: z.string().uuid(),
  })
  .strict();

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

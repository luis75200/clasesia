import { z } from 'zod';

/**
 * Esquemas de validación para el módulo de tickets
 */

export const listTicketsQuerySchema = z.object({
  skip: z.coerce
    .number()
    .int('skip debe ser un entero')
    .min(0, 'skip no puede ser negativo')
    .max(1000000, 'skip no puede exceder el límite')
    .optional()
    .default(0),
  
  take: z.coerce
    .number()
    .int('take debe ser un entero')
    .min(1, 'take debe ser al menos 1')
    .max(500, 'take no puede exceder 500')
    .optional()
    .default(50),
  
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  
  assignee_id: z.string().uuid('assignee_id debe ser un UUID válido').optional(),
  
  label: z.string().min(1).max(100).optional(),
  
  from_date: z
    .string()
    .datetime('from_date debe ser un ISO 8601 datetime')
    .optional(),
  
  to_date: z
    .string()
    .datetime('to_date debe ser un ISO 8601 datetime')
    .optional(),
});

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

/**
 * Validación de rango de fechas
 */
export const validateDateRange = (from?: string, to?: string) => {
  if (!from || !to) return true;
  
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  return fromDate <= toDate;
};

export const createTicketBodySchema = z.object({
  title: z
    .string({ required_error: 'title es requerido' })
    .min(1, 'title no puede estar vacío')
    .max(120, 'title no puede exceder 120 caracteres')
    .trim(),
  
  description: z
    .string()
    .max(10000, 'description no puede exceder 10000 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({ message: 'priority debe ser LOW, MEDIUM o HIGH' }),
    }),
  
  assignees: z
    .array(z.string().uuid('Cada assignee debe ser un UUID válido'))
    .optional()
    .default([]),
  
  labels: z
    .array(
      z
        .string()
        .min(1, 'Cada label debe tener al menos 1 carácter')
        .max(100, 'Cada label no puede exceder 100 caracteres')
        .trim()
    )
    .optional()
    .default([]),
});

export type CreateTicketBody = z.infer<typeof createTicketBodySchema>;

export const updateTicketBodySchema = z.object({
  title: z
    .string()
    .min(1, 'title no puede estar vacío')
    .max(120, 'title no puede exceder 120 caracteres')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(10000, 'description no puede exceder 10000 caracteres')
    .trim()
    .nullable()
    .optional(),
  
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  
  is_blocked: z.boolean().optional(),
  
  version: z.coerce.number().int().min(1),
});

export type UpdateTicketBody = z.infer<typeof updateTicketBodySchema>;

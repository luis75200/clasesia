import { z } from 'zod'

const statusEnum = z.enum(['ACTIVE', 'ARCHIVED'])

export const listProjectsQuerySchema = z
  .object({
    skip: z.coerce.number().int().min(0).max(1000000).default(0),
    take: z.coerce.number().int().min(1).max(500).default(50),
    status: statusEnum.optional(),
    search: z.string().trim().min(1).max(120).optional(),
  })
  .strict()

const projectKeyRegex = /^[A-Z][A-Z0-9_-]{1,31}$/

export const createProjectBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    key: z.string().trim().toUpperCase().regex(projectKeyRegex, 'key inválido (ej: ALPHA, APP_CORE)'),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()

export const updateProjectBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    key: z.string().trim().toUpperCase().regex(projectKeyRegex, 'key inválido (ej: ALPHA, APP_CORE)').optional(),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Se requiere al menos un campo para actualizar',
  })

import { z } from 'zod'

export const loginBodySchema = z
  .object({
    email: z.string().trim().email(),
    name: z.string().trim().min(2).max(120).optional(),
  })
  .strict()

export type LoginBody = z.infer<typeof loginBodySchema>

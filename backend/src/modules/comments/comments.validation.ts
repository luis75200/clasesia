import { z } from 'zod'

export const listCommentsQuerySchema = z
  .object({
    ticket_id: z.string().uuid(),
  })
  .strict()

export const createCommentBodySchema = z
  .object({
    ticket_id: z.string().uuid(),
    body: z.string().trim().min(1).max(10000),
  })
  .strict()

import { z } from 'zod'

export const metricsQuerySchema = z
  .object({
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.from_date && value.to_date) {
      const from = new Date(value.from_date)
      const to = new Date(value.to_date)

      if (from > to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['from_date'],
          message: 'from_date debe ser menor o igual a to_date',
        })
      }
    }
  })

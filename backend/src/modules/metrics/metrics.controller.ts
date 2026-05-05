import type { Request, Response } from 'express'
import type { ZodIssue } from 'zod'
import { Errors } from '../../http/api-error.js'
import { metricsService } from './metrics.service.js'
import { metricsQuerySchema } from './metrics.validation.js'

function toValidationDetails(issues: ZodIssue[]): Record<string, string> {
  return issues.reduce((acc: Record<string, string>, issue) => {
    const field = String(issue.path[0] ?? 'query')
    acc[field] = issue.message
    return acc
  }, {})
}

export async function getMetricsSummaryHandler(req: Request, res: Response): Promise<void> {
  const parsed = metricsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  const summary = await metricsService.getSummary(parsed.data)

  res.status(200).json({
    data: summary,
    requestId: req.requestId,
  })
}

export async function exportMetricsCsvHandler(req: Request, res: Response): Promise<void> {
  const parsed = metricsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  res.status(200)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="metrics-${Date.now()}.csv"`)

  await metricsService.streamCsv(parsed.data, (line) => {
    res.write(line)
  })

  res.end()
}

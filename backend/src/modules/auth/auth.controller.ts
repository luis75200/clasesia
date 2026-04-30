import type { Request, Response } from 'express'
import type { ZodIssue } from 'zod'
import { CONSTANTS } from '../../app/constants.js'
import { Errors } from '../../http/api-error.js'
import { authService } from './auth.service.js'
import { loginBodySchema } from './auth.validation.js'

function zodDetails(issues: ZodIssue[]): Record<string, string> {
  return issues.reduce((acc: Record<string, string>, issue) => {
    const field = String(issue.path[0] ?? 'body')
    acc[field] = issue.message
    return acc
  }, {})
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parsed = loginBodySchema.safeParse(req.body)
  if (!parsed.success) throw Errors.VALIDATION_ERROR(zodDetails(parsed.error.issues))

  const result = await authService.login(parsed.data, {
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  })

  res.cookie(CONSTANTS.SESSION_COOKIE_NAME, result.sessionToken, CONSTANTS.SESSION_COOKIE_OPTIONS)

  res.status(200).json({
    data: { user: result.user },
    requestId: req.requestId,
  })
}

export async function sessionHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  res.status(200).json({
    data: { user: req.user },
    requestId: req.requestId,
  })
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const sessionToken = req.cookies?.[CONSTANTS.SESSION_COOKIE_NAME]
  if (!sessionToken) throw Errors.UNAUTHORIZED()

  await authService.logout(sessionToken)
  res.clearCookie(CONSTANTS.SESSION_COOKIE_NAME, CONSTANTS.SESSION_COOKIE_OPTIONS)

  res.status(200).json({
    data: { success: true },
    requestId: req.requestId,
  })
}

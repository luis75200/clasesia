import type { Request, Response } from 'express'
import type { ZodIssue } from 'zod'
import { Errors } from '../../http/api-error.js'
import { commentsService } from './comments.service.js'
import { createCommentBodySchema, listCommentsQuerySchema } from './comments.validation.js'

function toValidationDetails(issues: ZodIssue[]): Record<string, string> {
  return issues.reduce((acc: Record<string, string>, issue) => {
    const field = String(issue.path[0] ?? 'body')
    acc[field] = issue.message
    return acc
  }, {})
}

export async function listCommentsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listCommentsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  const comments = await commentsService.listComments(parsed.data)

  res.status(200).json({
    data: comments,
    requestId: req.requestId,
  })
}

export async function createCommentHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const parsed = createCommentBodySchema.safeParse(req.body)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  const comment = await commentsService.createComment(parsed.data, { id: req.user.id })

  res.status(201).json({
    data: comment,
    requestId: req.requestId,
  })
}

export async function archiveCommentHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const { id } = req.params
  await commentsService.archiveComment(id, {
    id: req.user.id,
    role: req.user.role,
  })

  res.status(200).json({
    data: { success: true },
    requestId: req.requestId,
  })
}

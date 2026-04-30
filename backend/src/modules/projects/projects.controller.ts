import type { Request, Response } from 'express'
import type { ZodIssue } from 'zod'
import { Errors } from '../../http/api-error.js'
import { projectsService } from './projects.service.js'
import {
  createProjectBodySchema,
  listProjectsQuerySchema,
  updateProjectBodySchema,
} from './projects.validation.js'

function toValidationDetails(issues: ZodIssue[]): Record<string, string> {
  return issues.reduce((acc: Record<string, string>, issue) => {
    const field = String(issue.path[0] ?? 'body')
    acc[field] = issue.message
    return acc
  }, {})
}

export async function listProjectsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listProjectsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  const result = await projectsService.listProjects(parsed.data)
  res.status(200).json({
    ...result,
    requestId: req.requestId,
  })
}

export async function getProjectHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const project = await projectsService.getProject(id)

  res.status(200).json({
    data: project,
    requestId: req.requestId,
  })
}

export async function createProjectHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const parsed = createProjectBodySchema.safeParse(req.body)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  const project = await projectsService.createProject(parsed.data, req.user.id)

  res.status(201).json({
    data: project,
    requestId: req.requestId,
  })
}

export async function updateProjectHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const parsed = updateProjectBodySchema.safeParse(req.body)
  if (!parsed.success) {
    throw Errors.VALIDATION_ERROR(toValidationDetails(parsed.error.issues))
  }

  const { id } = req.params
  const project = await projectsService.updateProject(id, parsed.data)

  res.status(200).json({
    data: project,
    requestId: req.requestId,
  })
}

export async function archiveProjectHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const { id } = req.params
  const project = await projectsService.archiveProject(id)

  res.status(200).json({
    data: project,
    requestId: req.requestId,
  })
}

export async function restoreProjectHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const { id } = req.params
  const project = await projectsService.restoreProject(id)

  res.status(200).json({
    data: project,
    requestId: req.requestId,
  })
}

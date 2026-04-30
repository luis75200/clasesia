import { Request, Response } from 'express';
import { ZodIssue } from 'zod';
import { Errors } from '../../http/api-error.js';
import { assignProjectBodySchema, createTaskBodySchema, listTasksQuerySchema } from './tasks.validation.js';
import { tasksService } from './tasks.service.js';

export const listTasksHandler = async (req: Request, res: Response): Promise<void> => {
  const parsedQuery = listTasksQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    const details = parsedQuery.error.issues.reduce((acc: Record<string, string>, issue: ZodIssue) => {
      const field = String(issue.path[0] ?? 'query');
      acc[field] = issue.message;
      return acc;
    }, {});
    throw Errors.VALIDATION_ERROR(details);
  }

  const result = await tasksService.listTasks(parsedQuery.data);

  res.status(200).json({
    data: result.data,
    total: result.total,
    skip: result.skip,
    take: result.take,
    requestId: req.requestId,
  });
};

export const createTaskHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw Errors.UNAUTHORIZED();
  }

  const parsedBody = createTaskBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    const details = parsedBody.error.issues.reduce((acc: Record<string, string>, issue: ZodIssue) => {
      const field = String(issue.path[0] ?? 'body');
      acc[field] = issue.message;
      return acc;
    }, {});
    throw Errors.VALIDATION_ERROR(details);
  }

  const task = await tasksService.createTask(parsedBody.data, req.user.id);

  res.status(201).json({
    data: task,
    requestId: req.requestId,
  });
};

export const assignTaskProjectHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw Errors.UNAUTHORIZED();
  }

  const parsedBody = assignProjectBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    const details = parsedBody.error.issues.reduce((acc: Record<string, string>, issue: ZodIssue) => {
      const field = String(issue.path[0] ?? 'body');
      acc[field] = issue.message;
      return acc;
    }, {});
    throw Errors.VALIDATION_ERROR(details);
  }

  const { id } = req.params;
  const task = await tasksService.assignProject(id, parsedBody.data);

  res.status(200).json({
    data: task,
    requestId: req.requestId,
  });
};

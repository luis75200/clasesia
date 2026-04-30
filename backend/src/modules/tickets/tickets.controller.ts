/**
 * Controllers de tickets
 * Handlers HTTP para endpoints
 */

import { Request, Response } from 'express';
import { ticketsService } from './tickets.service.js';
import {
  listTicketsQuerySchema,
  createTicketBodySchema,
} from './tickets.validation.js';
import { ZodIssue } from 'zod';
import { Errors } from '../../lib/http/api-error.js';

/**
 * GET /api/tickets
 * Lista tickets con paginación y filtros
 */
export const listTicketsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validar query params
  const queryResult = listTicketsQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    const errors = queryResult.error.errors.reduce(
      (acc: Record<string, string>, err: ZodIssue) => {
        const field = String(err.path[0]);
        acc[field] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );

    throw Errors.VALIDATION_ERROR(errors);
  }

  const filters = queryResult.data;

  // Llamar al service
  const result = await ticketsService.listTickets(filters);

  res.status(200).json({
    data: result.data,
    total: result.total,
    skip: result.skip,
    take: result.take,
    requestId: req.requestId,
  });
};

/**
 * POST /api/tickets
 * Crea nuevo ticket
 * Requiere autenticación
 */
export const createTicketHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validar que hay usuario autenticado
  if (!req.user) {
    throw Errors.UNAUTHORIZED();
  }

  // Validar body
  const bodyResult = createTicketBodySchema.safeParse(req.body);

  if (!bodyResult.success) {
    const errors = bodyResult.error.errors.reduce(
      (acc: Record<string, string>, err: ZodIssue) => {
        const field = String(err.path[0]);
        acc[field] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );

    throw Errors.VALIDATION_ERROR(errors);
  }

  const input = bodyResult.data;

  // Crear ticket
  const newTicket = await ticketsService.createTicket(input, req.user.id);

  res.status(201).json({
    data: newTicket,
    requestId: req.requestId,
  });
};

/**
 * GET /api/tickets/:id
 * Obtiene detalle de ticket
 */
export const getTicketHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  // Validar que id sea UUID válido
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw Errors.BAD_REQUEST('id debe ser un UUID válido');
  }

  // Obtener ticket
  const ticket = await ticketsService.getTicketById(id);

  res.status(200).json({
    data: ticket,
    requestId: req.requestId,
  });
};

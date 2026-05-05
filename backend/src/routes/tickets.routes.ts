/**
 * Rutas del módulo de tickets
 */

import { Router } from 'express';
import {
  archiveTicketHandler,
  changeTicketStatusHandler,
  listTicketsHandler,
  createTicketHandler,
  getTicketHandler,
  updateTicketHandler,
} from '../modules/tickets/tickets.controller.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * GET /api/tickets
 * Listar tickets con paginación y filtros
 */
router.get('/', authMiddleware, asyncHandler(listTicketsHandler));

/**
 * POST /api/tickets
 * Crear nuevo ticket
 * Requiere autenticación
 */
router.post('/', authMiddleware, asyncHandler(createTicketHandler));

/**
 * GET /api/tickets/:id
 * Obtener detalle de ticket
 */
router.get('/:id', authMiddleware, asyncHandler(getTicketHandler));
router.patch('/:id', authMiddleware, asyncHandler(updateTicketHandler));
router.post('/:id/archive', authMiddleware, asyncHandler(archiveTicketHandler));

/**
 * POST /api/tickets/:id/change-status
 * Mueve ticket entre columnas Kanban con control de version
 */
router.post('/:id/change-status', authMiddleware, asyncHandler(changeTicketStatusHandler));

export default router;

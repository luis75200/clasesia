/**
 * Rutas del módulo de tickets
 */

import { Router } from 'express';
import {
  listTicketsHandler,
  createTicketHandler,
  getTicketHandler,
} from '../modules/tickets/tickets.controller.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * GET /api/tickets
 * Listar tickets con paginación y filtros
 */
router.get('/', asyncHandler(listTicketsHandler));

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
router.get('/:id', asyncHandler(getTicketHandler));

export default router;

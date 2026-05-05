import { Router } from 'express';
import authRoutes from './auth.routes.js';
import commentsRoutes from './comments.routes.js';
import metricsRoutes from './metrics.routes.js';
import projectsRoutes from './projects.routes.js';
import tasksRoutes from './tasks.routes.js';
import ticketsRoutes from './tickets.routes.js';

/**
 * Enrutador principal de API
 * Centraliza el registro de módulos de rutas
 */

const router = Router();

/**
 * Módulos de rutas
 */
router.use('/tickets', ticketsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/projects', projectsRoutes);
router.use('/auth', authRoutes);
router.use('/metrics', metricsRoutes);
router.use('/comments', commentsRoutes);

/**
 * Módulos pendientes de implementación
 * 
 * router.use('/users', usersRoutes);
 * router.use('/comments', commentsRoutes);
 * router.use('/archived', archivedRoutes);
 */

export default router;

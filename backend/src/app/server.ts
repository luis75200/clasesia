import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { requestIdMiddleware } from '../middlewares/request-id.middleware.js';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { sessionMiddleware } from '../middlewares/session.middleware.js';
import apiRouter from '../routes/index.js';

/**
 * Crea y configura la aplicación Express base
 * Incluye rutas de módulos y middleware global
 */

export function createApp(): Express {
  const app = express();

  /**
   * Middleware global
   */
  
  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Cookies
  app.use(cookieParser(env.SESSION_SECRET));

  // Request ID para trazabilidad
  app.use(requestIdMiddleware);

  // Resolver sesión desde cookie para req.user / req.sessionId
  app.use(sessionMiddleware);

  // CORS para frontend Vite
  const allowedOrigins = new Set([env.FRONTEND_URL, 'http://localhost:5173']);
  app.use((req, res, next) => {
    const requestOrigin = req.header('origin');

    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    }

    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  /**
   * Health check
   */
  app.get('/health', asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }));

  /**
   * API routes
   */
  app.use('/api', apiRouter);

  /**
   * 404 handler
   */
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: `Ruta ${req.method} ${req.path} no encontrada`,
      requestId: req.requestId,
    });
  });

  /**
   * Error handler (siempre último)
   */
  app.use(errorMiddleware);

  return app;
}

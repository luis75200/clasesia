import { Request, Response, NextFunction } from 'express';
import { Errors } from '../lib/http/api-error.js';

/**
 * Middleware que valida sesión y usuario autenticado
 * Devuelve 401 si no hay sesión válida
 */

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw Errors.UNAUTHORIZED();
  }
  next();
}

/**
 * Middleware que valida que el usuario sea admin
 * Requiere authMiddleware ejecutado previamente
 */

export function adminMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw Errors.UNAUTHORIZED();
  }

  if (req.user.role !== 'admin') {
    throw Errors.FORBIDDEN('Se requiere rol admin');
  }

  next();
}

import { Response, NextFunction, Request } from 'express';
import { ApiError, Errors } from '../http/api-error.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware de manejo de errores centralizado
 * Debe ser el último middleware registrado en Express
 */

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = _req.requestId || uuidv4();

  // Si es ApiError, usarlo directamente
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    });
  }

  // Si es error de validación Zod
  if (err instanceof Error && err.name === 'ZodError') {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Validación fallida',
      details: (err as any).errors,
      requestId,
    });
  }

  // Error genérico
  const message = err instanceof Error ? err.message : 'Error desconocido';
  const cause = err instanceof Error ? err : new Error(String(err));

  console.error(`[${requestId}] Unhandled error:`, cause);

  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? { error: message } : undefined,
    requestId,
  });
}

/**
 * Wrapper para convertir funciones async en manejadores Express
 * Captura errores y los pasa a next()
 */

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

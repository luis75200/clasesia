import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CONSTANTS } from '../app/constants.js';

/**
 * Middleware que asigna un requestId único a cada request
 * para trazabilidad en logs
 */

export function requestIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const headerValue = req.header(CONSTANTS.REQUEST_ID_HEADER);
  req.requestId = headerValue ?? uuidv4();
  next();
}

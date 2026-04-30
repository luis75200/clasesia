import Express from 'express';
import { User } from '../db/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
      requestId: string;
    }
  }
}

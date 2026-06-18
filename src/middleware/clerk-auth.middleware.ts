import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { verifyClerkToken } from '../config/clerk.config';

export interface ClerkAuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const clerkAuthMiddleware = async (req: ClerkAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyClerkToken(token);

    if (!payload) {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    req.userId = payload.sub;
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
  }
};

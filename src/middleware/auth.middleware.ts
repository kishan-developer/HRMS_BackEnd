import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

export interface AuthRequest extends Request {
  userId?: string;
  employeeId?: string;
  role?: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
}

export const authMiddleware = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  console.log('Auth middleware - authHeader:', authHeader ? authHeader.substring(0, 20) + '...' : 'No auth header');
  console.log('Auth middleware - JWT_SECRET from env:', process.env.JWT_SECRET ? 'Set' : 'Not set');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth middleware - No token provided or invalid format');
    throw new AppError('No token provided', 401, 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1];
  console.log('Auth middleware - Token extracted, length:', token.length);

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    console.log('Auth middleware - Using secret:', secret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      employeeId?: string;
      role: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
    };

    console.log('Auth middleware - Token decoded successfully:', decoded);
    req.userId = decoded.userId;
    req.employeeId = decoded.employeeId;
    req.role = decoded.role;

    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error);
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import routes from './src/routes';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './src/middleware/error.middleware';

dotenv.config();

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168')) {
        return callback(null, true);
      }

      // In production, allow the configured frontend URL
      if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
        if (origin === process.env.FRONTEND_URL) {
          return callback(null, true);
        }
      }

      callback(null, true); // Allow all origins for now
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API Running',
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API',
    version: '1.0.0'
  });
});

app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
3
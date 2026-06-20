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
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : true, // Allow all origins in development
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
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import routes from './routes';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/error.middleware';

dotenv.config();

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://192.168.1.3:8081', 'exp://192.168.1.3:8081', 'http://localhost:8081', 'exp://localhost:8081'],
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

app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
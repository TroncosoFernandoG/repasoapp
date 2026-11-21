import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './routes/authRoutes';
import { topicRoutes } from './routes/topicRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'RepasoApp API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

export { app };
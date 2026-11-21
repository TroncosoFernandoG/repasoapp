import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'RepasoApp API' });
});

app.listen(env.port, () => {
  console.log(`Servidor RepasoApp corriendo en puerto ${env.port}`);
});
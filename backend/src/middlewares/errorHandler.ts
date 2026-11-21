import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

interface JsonSyntaxError extends SyntaxError {
  status?: number;
  body?: unknown;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  const syntaxErr = err as JsonSyntaxError;
  if (syntaxErr instanceof SyntaxError && syntaxErr.status === 400 && 'body' in syntaxErr) {
    res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }

  console.error('Error interno no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
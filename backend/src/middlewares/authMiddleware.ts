import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest, JwtPayloadData } from '../types/auth.types';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayloadData;
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
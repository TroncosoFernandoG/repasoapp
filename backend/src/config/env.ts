import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  frontendUrl: string;
}

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Falta la variable de entorno obligatoria: ${key}`);
  }
  return value.trim();
};

export const env: EnvConfig = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: getRequiredEnv('DATABASE_URL'),
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  frontendUrl: process.env.FRONTEND_URL?.trim() || 'http://localhost:5173'
};
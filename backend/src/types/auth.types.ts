import { Request } from 'express';

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface JwtPayloadData {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadData;
}
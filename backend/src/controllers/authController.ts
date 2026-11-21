import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { LoginDTO, RegisterDTO } from '../types/auth.types';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body as RegisterDTO);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body as LoginDTO);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
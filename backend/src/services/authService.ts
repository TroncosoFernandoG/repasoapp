import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { UserRepository } from '../repositories/userRepository';
import { AuthResponse, LoginDTO, RegisterDTO } from '../types/auth.types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterDTO): Promise<AuthResponse> {
    const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';

    if (fullName.length < 3 || fullName.length > 80) {
      throw new AppError('El nombre completo debe tener entre 3 y 80 caracteres', 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new AppError('El formato del email no es válido', 400);
    }
    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Ya existe una cuenta registrada con ese email', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await this.userRepository.create({
      fullName,
      email,
      passwordHash
    });

    const token = this.signToken(createdUser.id, createdUser.email);

    return {
      token,
      user: {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email
      }
    };
  }

  async login(input: LoginDTO): Promise<AuthResponse> {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';

    if (!email || !password) {
      throw new AppError('Debe ingresar email y contraseña', 400);
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = this.signToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    };
  }

  private signToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.jwtSecret, { expiresIn: '7d' });
  }
}
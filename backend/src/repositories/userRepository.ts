import { User } from '@prisma/client';
import { prisma } from '../config/database';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  }
}
import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  async findById(id: number): Promise<User> {
    // Aquí implementarías la lógica para buscar el usuario por ID
    // Por ahora retornamos un mock
    return {
      id,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
} 
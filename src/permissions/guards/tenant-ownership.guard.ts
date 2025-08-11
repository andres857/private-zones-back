// src/permissions/guards/tenant-ownership.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TenantOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const targetTenantId = this.extractTenantId(request);
    
    if (!targetTenantId) {
      // Si no hay tenantId en la request, asumir que es del propio tenant
      return true;
    }

    // Verificar si el usuario pertenece al tenant o es superadmin
    const userRecord = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles']
    });

    if (!userRecord) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Superadmin puede acceder a todo
    const isSuperAdmin = userRecord.roles.some(role => role.name === 'superadmin');
    if (isSuperAdmin) {
      return true;
    }

    // Verificar ownership del tenant
    if (userRecord.tenantId !== targetTenantId) {
      throw new ForbiddenException('No tienes acceso a los recursos de este tenant');
    }

    return true;
  }

  private extractTenantId(request: any): string | undefined {
    return request.params?.tenantId || 
           request.query?.tenantId || 
           request.headers['x-tenant-id'] || 
           request.body?.tenantId;
  }
}
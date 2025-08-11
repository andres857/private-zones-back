// src/permissions/guards/permission.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PERMISSIONS_KEY, ROLES_KEY, RequiredPermission } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Verificar roles requeridos
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      const hasRole = await this.checkUserRoles(user.id, requiredRoles);
      if (!hasRole) {
        throw new ForbiddenException('No tienes el rol necesario para acceder a este recurso');
      }
    }

    // Verificar permisos requeridos
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions) {
      const hasPermission = await this.checkUserPermissions(user.id, requiredPermissions, request);
      if (!hasPermission) {
        throw new ForbiddenException('No tienes permisos suficientes para realizar esta acción');
      }
    }

    return true;
  }

  private async checkUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    for (const role of requiredRoles) {
      if (await this.permissionsService.userHasRole(userId, role)) {
        return true;
      }
    }
    return false;
  }

  private async checkUserPermissions(
    userId: string,
    requiredPermissions: RequiredPermission[],
    request: any
  ): Promise<boolean> {
    // Obtener tenantId del parámetro, query o header
    const targetTenantId = this.extractTenantId(request);

    for (const permission of requiredPermissions) {
      if (await this.permissionsService.userHasPermission(
        userId,
        permission.resource,
        permission.action,
        targetTenantId
      )) {
        return true;
      }
    }
    return false;
  }

  private extractTenantId(request: any): string | undefined {
    // Buscar tenantId en diferentes lugares
    return request.params?.tenantId || 
           request.query?.tenantId || 
           request.headers['x-tenant-id'] || 
           request.body?.tenantId ||
           request.user?.tenantId; // Fallback al tenant del usuario
  }
}

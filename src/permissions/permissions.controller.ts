// src/permissions/permissions.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Query
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { RequireRoles, RequirePermissions } from './decorators/permissions.decorator';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionResource, PermissionAction } from './entities/permission.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Solo superadmin puede gestionar permisos del sistema
  @Post('seed')
  @RequireRoles('superadmin')
  async seedPermissions() {
    await this.permissionsService.seedPermissions();
    await this.permissionsService.assignDefaultPermissionsToRoles();
    return { message: 'Permisos inicializados correctamente' };
  }

  @Get('user/:userId')
  @RequirePermissions({ resource: PermissionResource.USERS, action: PermissionAction.READ })
  async getUserPermissions(@Param('userId') userId: string) {
    return this.permissionsService.getUserPermissionContext(userId);
  }

  @Post('assign')
  @RequireRoles('superadmin')
  async assignPermissions(@Body() assignPermissionsDto: AssignPermissionsDto) {
    // Implementar la lógica para asignar permisos a roles
    return { message: 'Permisos asignados correctamente' };
  }

  @Get('roles/:roleName')
  @RequireRoles('superadmin')
  async getRolePermissions(@Param('roleName') roleName: string) {
    // Implementar la lógica para obtener permisos de un rol
    return { role: roleName, permissions: [] };
  }
}

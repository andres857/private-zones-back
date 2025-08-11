// src/permissions/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PermissionResource, PermissionAction } from '../entities/permission.entity';

export interface RequiredPermission {
  resource: PermissionResource;
  action: PermissionAction;
}

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

export const RequirePermissions = (...permissions: RequiredPermission[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};

export const RequireRoles = (...roles: string[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
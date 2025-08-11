// src/permissions/permissions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission, PermissionResource, PermissionAction } from './entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';

export interface UserPermissionContext {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Verifica si un usuario tiene un permiso específico
   */
  async userHasPermission(
    userId: string,
    resource: PermissionResource,
    action: PermissionAction,
    targetTenantId?: string
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'tenant']
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener todos los permisos del usuario
    const userPermissions = this.getUserPermissions(user);
    const permissionName = Permission.createPermissionName(resource, action);

    // Verificar si tiene el permiso
    const hasPermission = userPermissions.some(p => 
      p.getFullPermissionName() === permissionName
    );

    if (!hasPermission) {
      return false;
    }

    // Si el permiso requiere ownership del tenant, verificar
    const permission = userPermissions.find(p => 
      p.getFullPermissionName() === permissionName
    );

    if (permission?.requiresTenantOwnership && targetTenantId) {
      return user.tenantId === targetTenantId;
    }

    return true;
  }

  /**
   * Obtiene el contexto de permisos de un usuario
   */
  async getUserPermissionContext(userId: string): Promise<UserPermissionContext> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions']
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const permissions = this.getUserPermissions(user);

    return {
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles.map(role => role.name),
      permissions: permissions.map(p => p.getFullPermissionName())
    };
  }

  /**
   * Verifica múltiples permisos para un usuario
   */
  async userHasAnyPermission(
    userId: string,
    permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
  ): Promise<boolean> {
    for (const perm of permissions) {
      if (await this.userHasPermission(userId, perm.resource, perm.action)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Verifica si un usuario tiene un rol específico
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });

    if (!user) {
      return false;
    }

    return user.roles.some(role => role.name === roleName);
  }

  /**
   * Obtiene todos los permisos de un usuario a través de sus roles
   */
  private getUserPermissions(user: User): Permission[] {
    const permissions: Permission[] = [];
    const permissionIds = new Set<string>();

    user.roles.forEach(role => {
      role.permissions?.forEach(permission => {
        if (!permissionIds.has(permission.id)) {
          permissions.push(permission);
          permissionIds.add(permission.id);
        }
      });
    });

    return permissions;
  }

  /**
   * Crea permisos por defecto del sistema
   */
  async seedPermissions(): Promise<void> {
    const permissionsToCreate = [
      // Usuarios
      { resource: PermissionResource.USERS, action: PermissionAction.CREATE, description: 'Crear usuarios', requiresTenantOwnership: true },
      { resource: PermissionResource.USERS, action: PermissionAction.READ, description: 'Ver usuarios', requiresTenantOwnership: true },
      { resource: PermissionResource.USERS, action: PermissionAction.UPDATE, description: 'Editar usuarios', requiresTenantOwnership: true },
      { resource: PermissionResource.USERS, action: PermissionAction.DELETE, description: 'Eliminar usuarios', requiresTenantOwnership: true },
      { resource: PermissionResource.USERS, action: PermissionAction.VIEW_ALL, description: 'Ver todos los usuarios', isSuperAdminOnly: true },

      // Cursos
      { resource: PermissionResource.COURSES, action: PermissionAction.CREATE, description: 'Crear cursos', requiresTenantOwnership: true },
      { resource: PermissionResource.COURSES, action: PermissionAction.READ, description: 'Ver cursos', requiresTenantOwnership: true },
      { resource: PermissionResource.COURSES, action: PermissionAction.UPDATE, description: 'Editar cursos', requiresTenantOwnership: true },
      { resource: PermissionResource.COURSES, action: PermissionAction.DELETE, description: 'Eliminar cursos', requiresTenantOwnership: true },

      // Secciones
      { resource: PermissionResource.SECTIONS, action: PermissionAction.CREATE, description: 'Crear secciones', requiresTenantOwnership: true },
      { resource: PermissionResource.SECTIONS, action: PermissionAction.READ, description: 'Ver secciones', requiresTenantOwnership: true },
      { resource: PermissionResource.SECTIONS, action: PermissionAction.UPDATE, description: 'Editar secciones', requiresTenantOwnership: true },
      { resource: PermissionResource.SECTIONS, action: PermissionAction.DELETE, description: 'Eliminar secciones', requiresTenantOwnership: true },

      // Tenants
      { resource: PermissionResource.TENANTS, action: PermissionAction.CREATE, description: 'Crear tenants/clientes', isSuperAdminOnly: true },
      { resource: PermissionResource.TENANTS, action: PermissionAction.READ, description: 'Ver información del tenant', requiresTenantOwnership: true },
      { resource: PermissionResource.TENANTS, action: PermissionAction.UPDATE, description: 'Editar configuración del tenant', requiresTenantOwnership: true },
      { resource: PermissionResource.TENANTS, action: PermissionAction.VIEW_ALL, description: 'Ver todos los tenants', isSuperAdminOnly: true },
      { resource: PermissionResource.TENANTS, action: PermissionAction.MANAGE, description: 'Gestión completa de tenants', isSuperAdminOnly: true },

      // Roles
      { resource: PermissionResource.ROLES, action: PermissionAction.ASSIGN, description: 'Asignar roles a usuarios', requiresTenantOwnership: true },
      { resource: PermissionResource.ROLES, action: PermissionAction.CREATE, description: 'Crear roles personalizados', isSuperAdminOnly: true },
      { resource: PermissionResource.ROLES, action: PermissionAction.UPDATE, description: 'Editar roles', isSuperAdminOnly: true },

      // Dashboard y reportes
      // { resource: PermissionResource.DASHBOARD, action: PermissionAction.READ, description: 'Ver dashboard', requiresTenantOwnership: true },
      // { resource: PermissionResource.REPORTS, action: PermissionAction.READ, description: 'Ver reportes', requiresTenantOwnership: true },
      // { resource: PermissionResource.REPORTS, action: PermissionAction.EXPORT, description: 'Exportar reportes' },

      // Configuraciones
      // { resource: PermissionResource.SETTINGS, action: PermissionAction.UPDATE, description: 'Modificar configuraciones del tenant', requiresTenantOwnership: true },
    ];

    for (const permData of permissionsToCreate) {
      const permissionName = Permission.createPermissionName(permData.resource, permData.action);
      
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: permissionName }
      });

      if (!existingPermission) {
        const permission = this.permissionRepository.create({
          name: permissionName,
          resource: permData.resource,
          action: permData.action,
          description: permData.description,
          requiresTenantOwnership: permData.requiresTenantOwnership || false,
          isSuperAdminOnly: permData.isSuperAdminOnly || false
        });

        await this.permissionRepository.save(permission);
      }
    }
  }

  /**
   * Asigna permisos por defecto a los roles del sistema
   */
  async assignDefaultPermissionsToRoles(): Promise<void> {
    // Permisos para Superadmin (todos)
    const allPermissions = await this.permissionRepository.find();
    await this.assignPermissionsToRole('superadmin', allPermissions.map(p => p.name));

    // Permisos para Admin
    const adminPermissions = [
      'users:create', 'users:read', 'users:update', 'users:delete',
      'courses:create', 'courses:read', 'courses:update', 'courses:delete',
      'sections:create', 'sections:read', 'sections:update', 'sections:delete',
      'tenants:read', 'tenants:update',
      'roles:assign',
      'dashboard:read', 'reports:read', 'reports:export',
      'settings:update'
    ];
    await this.assignPermissionsToRole('admin', adminPermissions);

    // Permisos para Host (subset de Admin)
    const hostPermissions = [
      'users:read', 'users:update',
      'courses:create', 'courses:read', 'courses:update',
      'sections:read', 'sections:update',
      'tenants:read',
      'dashboard:read', 'reports:read'
    ];
    await this.assignPermissionsToRole('host', hostPermissions);

    // Permisos para User/Student (mínimos)
    const userPermissions = [
      'courses:read',
      'sections:read',
      'dashboard:read'
    ];
    await this.assignPermissionsToRole('user', userPermissions);
  }

  /**
   * Asigna permisos específicos a un rol
   */
  async assignPermissionsToRole(roleName: string, permissionNames: string[]): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
      relations: ['permissions']
    });

    if (!role) {
      console.warn(`Rol ${roleName} no encontrado`);
      return;
    }

    const permissions = await this.permissionRepository.find({
      where: { name: In(permissionNames) }
    });

    role.permissions = permissions;
    await this.roleRepository.save(role);
  }
}
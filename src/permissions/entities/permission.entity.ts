// src/permissions/entities/permission.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';

export enum PermissionResource {
  USERS = 'users',
  COURSES = 'courses',
  SECTIONS = 'sections',
  TENANTS = 'tenants',
  ROLES = 'roles',
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  REPORTS = 'reports',
  CONTENT = 'content',
  ENROLLMENTS = 'enrollments',
  PAYMENTS = 'payments'
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN = 'assign',
  MANAGE = 'manage',
  VIEW_ALL = 'view_all',
  EXPORT = 'export',
  IMPORT = 'import'
}

@Entity('permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // ej: "users:create", "courses:update"

  @Column({
    type: 'enum',
    enum: PermissionResource
  })
  resource: PermissionResource;

  @Column({
    type: 'enum',
    enum: PermissionAction
  })
  action: PermissionAction;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  requiresTenantOwnership: boolean; // Si requiere que el recurso pertenezca al tenant del usuario

  @Column({ default: false })
  isSuperAdminOnly: boolean; // Solo para superadmin

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  getFullPermissionName(): string {
    return `${this.resource}:${this.action}`;
  }

  static createPermissionName(resource: PermissionResource, action: PermissionAction): string {
    return `${resource}:${action}`;
  }
}
// src/permissions/entities/user-tenant-permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Permission } from './permission.entity';

// Tabla para permisos específicos de usuario en un tenant
// Útil para usuario que necesita permisos específicos
@Entity('user_tenant_permissions')
@Index(['userId', 'tenantId', 'permissionId'], { unique: true })
export class UserTenantPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @Column()
  permissionId: string;

  @Column({ default: true })
  granted: boolean; // true = permitido, false = denegado explícitamente

  @Column({ nullable: true })
  grantedBy: string; // ID del usuario que concedió el permiso

  @Column({ nullable: true })
  expiresAt: Date; // Fecha de expiración del permiso

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
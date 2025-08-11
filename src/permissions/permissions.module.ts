// src/permissions/permissions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionGuard } from './guards/permission.guard';
import { TenantOwnershipGuard } from './guards/tenant-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role, User])
  ],
  providers: [PermissionsService, PermissionGuard, TenantOwnershipGuard],
  controllers: [PermissionsController],
  exports: [PermissionsService, PermissionGuard, TenantOwnershipGuard]
})
export class PermissionsModule {}
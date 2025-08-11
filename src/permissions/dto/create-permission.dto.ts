// src/permissions/dto/create-permission.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { PermissionResource, PermissionAction } from '../entities/permission.entity';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(PermissionResource)
  resource: PermissionResource;

  @IsNotEmpty()
  @IsEnum(PermissionAction)
  action: PermissionAction;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  requiresTenantOwnership?: boolean;

  @IsOptional()
  @IsBoolean()
  isSuperAdminOnly?: boolean;
}
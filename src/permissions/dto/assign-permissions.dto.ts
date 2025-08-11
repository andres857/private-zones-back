// src/permissions/dto/assign-permissions.dto.ts
import { IsArray, IsNotEmpty, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @IsNotEmpty()
  @IsUUID()
  roleId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}
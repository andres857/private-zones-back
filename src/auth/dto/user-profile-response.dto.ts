// src/auth/dto/user-profile-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { RoleResponseDto } from '../../roles/dto/role-response.dto';
import { UserProfileConfigResponseDto } from './user-profile-config-response.dto';

export class UserProfileResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => RoleResponseDto)
  roles: RoleResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => UserProfileConfigResponseDto)
  profileConfig?: UserProfileConfigResponseDto;


}
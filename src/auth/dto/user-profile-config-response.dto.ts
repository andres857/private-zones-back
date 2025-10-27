// src/users/dto/user-profile-config-response.dto.ts
import { Expose } from 'class-transformer';

export class UserProfileConfigResponseDto {
  @Expose()
  id: string;

  @Expose()
  avatarPath?: string;

  @Expose()
  bio?: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  type_document?: string;

  @Expose()
  documentNumber?: string;

  @Expose()
  organization?: string;

  @Expose()
  charge?: string;

  @Expose()
  gender?: string;

  @Expose()
  city?: string;

  @Expose()
  country?: string;

  @Expose()
  address?: string;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
// src/roles/dto/role-response.dto.ts
import { Expose } from 'class-transformer';

export class RoleResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;
}
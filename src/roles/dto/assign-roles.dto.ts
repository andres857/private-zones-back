import { IsArray, IsNotEmpty, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignRolesDto {
  @IsNotEmpty()
  userId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  roleIds: string[];
}

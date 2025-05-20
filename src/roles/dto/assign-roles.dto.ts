import { IsArray, IsNotEmpty, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignRolesDto {
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  roleIds: string[];
}

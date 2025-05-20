import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength, IsOptional, IsEnum, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @IsOptional()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true, message: 'Cada rol debe ser un string' })
  roles?: string[]; // Cambiar de UserRole[] a string[]
}

// src/users/dto/change-password.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  oldPass: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede tener más de 50 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
    { message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
  )
  newPass: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  confirmPass: string;
}
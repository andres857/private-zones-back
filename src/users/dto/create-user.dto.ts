import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  IsUUID, 
  MinLength, 
  IsOptional, 
  IsEnum, 
  ArrayNotEmpty, 
  ArrayUnique,
  IsBoolean,
  IsDateString,
  IsPhoneNumber,
  Length,
  Matches,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para configuración del perfil (opcional en creación)
export class CreateUserProfileConfigDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  bio?: string;

  @IsOptional()
  @IsPhoneNumber('CO')
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['DNI', 'CEDULA', 'PASAPORTE', 'LICENCIA', 'TARJETA_DE_IDENTIDAD'], {
    message: 'Tipo de documento debe ser: DNI, CEDULA, PASAPORTE, LICENCIA o TARJETA DE IDENTIDAD'
  })
  typeDocument?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  organization?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  charge?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'], {
    message: 'Género debe ser: MASCULINO, FEMENINO, OTRO o PREFIERO_NO_DECIR'
  })
  gender?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

// DTO para configuración de notificaciones (opcional en creación)
export class CreateUserNotificationConfigDto {
  @IsOptional()
  @IsBoolean()
  enableNotifications?: boolean = true;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean = false;

  @IsOptional()
  @IsBoolean()
  browserNotifications?: boolean = false;

  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean = true;

  @IsOptional()
  @IsBoolean()
  accountUpdates?: boolean = false;

  @IsOptional()
  @IsBoolean()
  systemUpdates?: boolean = true;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean = false;

  @IsOptional()
  @IsBoolean()
  newsletterEmails?: boolean = false;

  @IsOptional()
  @IsBoolean()
  reminders?: boolean = true;

  @IsOptional()
  @IsBoolean()
  mentions?: boolean = true;

  @IsOptional()
  @IsBoolean()
  directMessages?: boolean = true;
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  name: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser un texto' })
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
    }
  )
  password: string;

  @IsNotEmpty({ message: 'El tenantId es requerido' })
  @IsUUID('4', { message: 'El tenantId debe ser un UUID válido' })
  tenantId: string;

  @IsOptional()
  @ArrayNotEmpty({ message: 'Si se especifican roles, debe haber al menos uno' })
  @ArrayUnique({ message: 'Los roles no pueden estar duplicados' })
  @IsUUID('4', { 
    each: true, 
    message: 'Cada rol debe ser un UUID válido' 
  })
  roleIds?: string[]; // IDs de los roles

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  // Configuraciones opcionales que se pueden establecer en la creación
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserProfileConfigDto)
  @IsObject()
  profileConfig?: CreateUserProfileConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserNotificationConfigDto)
  @IsObject()
  notificationConfig?: CreateUserNotificationConfigDto;
}

// DTO alternativo más simple si se prefiere crear las configuraciones por separado
export class CreateUserSimpleDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  name: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser un texto' })
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
    }
  )
  password: string;

  @IsNotEmpty({ message: 'El tenantId es requerido' })
  @IsUUID('4', { message: 'El tenantId debe ser un UUID válido' })
  tenantId: string;

  @IsOptional()
  @ArrayNotEmpty({ message: 'Si se especifican roles, debe haber al menos uno' })
  @ArrayUnique({ message: 'Los roles no pueden estar duplicados' })
  @IsUUID('4', { 
    each: true, 
    message: 'Cada rol debe ser un UUID válido' 
  })
  roleIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
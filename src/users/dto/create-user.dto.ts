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
import { Transform, Type } from 'class-transformer';

import { DocumentType } from '../entities/user-profile-config.entity';


// DTO para actualizar configuración del perfil
export class UpdateUserProfileConfigDto {
  @IsOptional()
  @IsString({ message: 'bio debe ser string' })
  // @Length(1, 500, { message: 'bio debe tener entre 1 y 500 caracteres' })
  bio?: string;

  @IsOptional()
  // @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'type_document debe ser string' })
  @IsEnum(DocumentType, {
    message: 'Tipo de documento debe ser un valor válido'
  })
  type_document?: DocumentType ;

  @IsOptional()
  @IsString({ message: 'documentNumber debe ser string' })
  // @Length(1, 50, { message: 'documentNumber debe tener entre 1 y 50 caracteres' })
  documentNumber?: string;

  @IsOptional()
  @IsString({ message: 'organization debe ser string' })
  // @Length(1, 100, { message: 'organization debe tener entre 1 y 100 caracteres' })
  organization?: string;

  @IsOptional()
  @IsString({ message: 'charge debe ser string' })
  // @Length(1, 100, { message: 'charge debe tener entre 1 y 100 caracteres' })
  charge?: string;

  @IsOptional()
  @IsString({ message: 'gender debe ser string' })
  // @IsEnum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'], {
  //   message: 'Género debe ser: MASCULINO, FEMENINO, OTRO o PREFIERO_NO_DECIR'
  // })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'city debe ser string' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'country debe ser string' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'address debe ser string' })
  address?: string;

  @IsOptional()
  dateOfBirth?: string;
}

// DTO para actualizar configuración de notificaciones
export class UpdateUserNotificationConfigDto {
  @IsOptional()
  @IsBoolean({ message: 'enableNotifications debe ser booleano' })
  enableNotifications?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'smsNotifications debe ser booleano' })
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'browserNotifications debe ser booleano' })
  browserNotifications?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'securityAlerts debe ser booleano' })
  securityAlerts?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'accountUpdates debe ser booleano' })
  accountUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  systemUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  newsletterEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  reminders?: boolean;

  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @IsOptional()
  @IsBoolean()
  directMessages?: boolean;
}

export class UpdateUserDto {

  @IsOptional()
  @IsString({ message: 'El ID debe ser un texto' })
  tenantId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto' })
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  // @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto' })
  // @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  // Nota: Para actualizar contraseña, considera crear un endpoint separado por seguridad
  // @IsOptional()
  // @IsString({ message: 'La contraseña debe ser un texto' })
  // @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  // @Matches(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  //   {
  //     message: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
  //   }
  // )
  // password?: string;

  // tenantId generalmente no se actualiza, lo excluimos
  
  @IsOptional()
  @ArrayUnique({ message: 'Los roles no pueden estar duplicados' })
  @IsUUID('4', { 
    each: true, 
    message: 'Cada rol debe ser un UUID válido' 
  })
  roleIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Configuraciones opcionales que se pueden actualizar
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserProfileConfigDto)
  profileConfig?: UpdateUserProfileConfigDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserNotificationConfigDto)
  notificationConfig?: UpdateUserNotificationConfigDto;
}

// DTO para configuración del perfil (opcional en creación)
export class CreateUserProfileConfigDto {
  @IsOptional()
  @IsString({ message: 'bio debe ser string' })
  @Length(1, 500, { message: 'bio debe tener entre 1 y 500 caracteres' })
  bio?: string;

  @IsOptional()
  // @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'type_document debe ser string' })
  @IsEnum(DocumentType, {
    message: 'Tipo de documento debe ser un valor válido'
  })
  type_document?: DocumentType;

  @IsOptional()
  @IsString({ message: 'documentNumber debe ser string' })
  @Length(1, 50, { message: 'documentNumber debe tener entre 1 y 50 caracteres' })
  documentNumber?: string;

  @IsOptional()
  @IsString({ message: 'organization debe ser string' })
  @Length(1, 100, { message: 'organization debe tener entre 1 y 100 caracteres' })
  organization?: string;

  @IsOptional()
  @IsString({ message: 'charge debe ser string' })
  @Length(1, 100, { message: 'charge debe tener entre 1 y 100 caracteres' })
  charge?: string | null;

  @IsOptional()
  @IsString({ message: 'gender debe ser string' })
  @IsEnum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'], {
    message: 'Género debe ser: MASCULINO, FEMENINO, OTRO o PREFIERO_NO_DECIR'
  })
  gender?: string | null;

  @IsOptional()
  @IsString({ message: 'city debe ser string' })
  // @Length(1, 100, { message: 'city debe tener entre 1 y 100 caracteres' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'country debe ser string' })
  // @Length(1, 100, { message: 'country debe tener entre 1 y 100 caracteres' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'address debe ser string' })
  // @Length(1, 255, { message: 'address debe tener entre 1 y 255 caracteres' })
  address?: string;

  @IsOptional()
  dateOfBirth?: string;
}

// DTO para configuración de notificaciones (opcional en creación)
export class CreateUserNotificationConfigDto {
  @IsOptional()
  @IsBoolean({ message: 'enableNotifications debe ser booleano' })
  enableNotifications?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'smsNotifications debe ser booleano' })
  smsNotifications?: boolean = false;

  @IsOptional()
  @IsBoolean({ message: 'browserNotifications debe ser booleano' })
  browserNotifications?: boolean = false;

  @IsOptional()
  @IsBoolean({ message: 'securityAlerts debe ser booleano' })
  securityAlerts?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'accountUpdates debe ser booleano' })
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
  // @ArrayNotEmpty({ message: 'Si se especifican roles, debe haber al menos uno' })
  @ArrayUnique({ message: 'Los roles no pueden estar duplicados' })
  @IsUUID('4', { 
    each: true, 
    message: 'Cada rol debe ser un UUID válido' 
  })
  roleIds?: string[]; // IDs de los roles

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 'on' || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === '' || value === 0 || value === '0' || value === null || value === undefined) {
      return false;
    }
    return Boolean(value);
  })
  isActive?: boolean = true;

  // Configuraciones opcionales que se pueden establecer en la creación
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateUserProfileConfigDto)
  profileConfig?: CreateUserProfileConfigDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateUserNotificationConfigDto)
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
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 'on' || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === '' || value === 0 || value === '0' || value === null || value === undefined) {
      return false;
    }
    return Boolean(value);
  })
  isActive?: boolean = true;
}
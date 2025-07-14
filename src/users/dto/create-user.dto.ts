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


// DTO para actualizar configuración del perfil
export class UpdateUserProfileConfigDto {
  @IsOptional()
  @IsString({ message: 'bio debe ser string' })
  @Length(1, 500, { message: 'bio debe tener entre 1 y 500 caracteres' })
  bio?: string;

  @IsOptional()
  // @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'type_document debe ser string' })
  @IsEnum(['DNI', 'CEDULA', 'PASAPORTE', 'LICENCIA', 'TARJETA_DE_IDENTIDAD'], {
    message: 'Tipo de documento debe ser: DNI, CEDULA, PASAPORTE, LICENCIA o TARJETA_DE_IDENTIDAD'
  })
  type_document?: string;

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
  charge?: string;

  @IsOptional()
  @IsString({ message: 'gender debe ser string' })
  @IsEnum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'], {
    message: 'Género debe ser: MASCULINO, FEMENINO, OTRO o PREFIERO_NO_DECIR'
  })
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
  @IsDateString({}, { message: 'dateOfBirth debe ser una fecha válida (YYYY-MM-DD)' })
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

  // Nota: Para actualizar contraseña, considera crear un endpoint separado por seguridad
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
    }
  )
  password?: string;

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
  @IsEnum(['DNI', 'CEDULA', 'PASAPORTE', 'LICENCIA', 'TARJETA_DE_IDENTIDAD'], {
    message: 'Tipo de documento debe ser: DNI, CEDULA, PASAPORTE, LICENCIA o TARJETA_DE_IDENTIDAD'
  })
  type_document?: string;

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
  charge?: string;

  @IsOptional()
  @IsString({ message: 'gender debe ser string' })
  @IsEnum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'], {
    message: 'Género debe ser: MASCULINO, FEMENINO, OTRO o PREFIERO_NO_DECIR'
  })
  gender?: string;

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
  @IsDateString({}, { message: 'dateOfBirth debe ser una fecha válida (YYYY-MM-DD)' })
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
  @IsBoolean()
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
  @IsBoolean()
  isActive?: boolean = true;
}
import { Type } from 'class-transformer';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  Matches, 
  Length,
  IsIn, 
  IsNumber,
  IsJSON,
  IsArray,
  IsBoolean,
  ValidateNested
} from 'class-validator';
import { ViewType } from '../entities/tenant-view-config.entity';

export class ViewSettingsDto {
  @IsIn(Object.values(ViewType), { message: 'El tipo de vista no es válido' })
  type: ViewType;

  @IsBoolean({message: 'customBackground debe ser true o false'})
  customBackground: boolean;

  @IsOptional()
  @IsIn(['image', 'color', 'none'], {
    message: 'El backgroundType debe ser: image, color o none',
  })
  backgroundType?: 'image' | 'color' | 'none';

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  additionalSettings?: Record<string, any>;
}

export class CreateTenantDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  name: string;

  @IsNotEmpty({ message: 'El slug es requerido' })
  @Length(3, 30, { message: 'El slug debe tener entre 3 y 30 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener minúsculas, números y guiones',
  })
  slug: string;

  @IsNotEmpty({ message: 'El dominio es requerido' })
  @IsString({ message: 'El dominio debe ser una cadena de texto' })
  @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'El formato del dominio no es válido',
  })
  domain: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email de contacto no tiene un formato válido' })
  contactEmail?: string;

  @IsOptional()
  @IsIn(['free', 'pro', 'enterprise'], {
    message: 'El plan debe ser: free, pro o enterprise',
  })
  plan?: string;

  @IsNotEmpty({ message: 'El maxUsers es requerido' })
  @IsNumber({}, { message: 'El maxUsers debe ser un número' })
  maxUsers: number;

  @IsOptional({ message: 'El storageLimit es requerido' })
  @IsNumber({}, { message: 'El storageLimit debe ser un número' })
  storageLimit: number;

  @IsNotEmpty({message: 'El contactPerson es requerido'})
  @IsString({ message: 'El contactPerson debe ser una cadena de texto' })
  contactPerson: string;

  @IsNotEmpty({ message: 'El Phone es requerido' })
  @IsString({ message: 'El Phone debe ser una cadena de texto' })
  phone: string;

  @IsNotEmpty({ message: 'El address es requerido' })
  @IsString({ message: 'El address debe ser una cadena de texto' })
  address: string;

  @IsOptional()
  @IsString({ message: 'El city debe ser una cadena de texto' })
  city: string;

  @IsOptional()
  @IsString({ message: 'El country debe ser una cadena de texto' })
  country: string;

  @IsOptional()
  @IsString({ message: 'El priamryColor debe ser una cadena de texto' })
  primaryColor?: string;

  @IsOptional()
  @IsString({ message: 'El secondaryColor debe ser una cadena de texto' })
  secondaryColor?: string;

  @IsNotEmpty({ message: 'El timezone es requerido' })
  @IsString({ message: 'El timezone debe ser una cadena de texto' })
  timezone: string;

  @IsNotEmpty({ message: 'El language es requerido' })
  @IsString({ message: 'El language debe ser una cadena de texto' })
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'El formato del language no es válido, debe ser un código ISO 639-1',
  })
  language: string;

  @IsOptional()
  @IsString({ message: 'El url_portal debe ser una cadena de texto' })
  url_portal: string;

  @IsOptional()
  @IsString({message: 'El nit debe ser una cadena de texto numerico'})
  nit: string;

  @IsOptional()
  @IsString({message: 'El backgroundColorNavbar debe ser una cadena de texto'})
  backgroundColorNavbar: string;

  @IsOptional()
  @IsString({message: 'El textColorNavbar debe ser una cadena de texto'})
  textColorNavbar: string;

  @IsOptional()
  @IsString({message: 'El logoNavbar debe ser una cadena de texto'})
  logoNavbar: string;

  @IsOptional()
  @IsBoolean({message: 'El showNotifications debe ser boolean'})
  showNotifications: boolean

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewSettingsDto)
  homeSettings: ViewSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewSettingsDto)
  videoCallSettings: ViewSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewSettingsDto)
  metricsSettings: ViewSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewSettingsDto)
  groupsSettings: ViewSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewSettingsDto)
  sectionsSettings: ViewSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewSettingsDto)
  faqSettings: ViewSettingsDto;

  @IsOptional()
  config?: {
    status?: boolean;
    primaryColor?: string;
    secondaryColor?: string;
    maxUsers?: number;
    storageLimit?: number;
  }

  @IsNotEmpty({message: 'El nombre del administrador es requerido'})
  @IsString({message: 'El nombre del administrador debe ser una cadena de texto'})
  adminFirstName: string;

  @IsNotEmpty({message: 'El apellido del administrador es requerido'})
  @IsString({message: 'El apellido del administrador debe ser una cadena de texto'})
  adminLastName: string;

  @IsNotEmpty({message: 'El email del administrador es requrido'})
  @IsEmail({}, {message: 'El email del administrador no es válido'})
  adminEmail: string;

  @IsNotEmpty({message: 'La contraseña del administrador es requerida'})
  @IsString({message: 'La contraseña del administrador debe ser una cadena de texto'})
  @Length(8, 128, {message: 'La contraseña del administrador debe tener entre 8 y 128 caracteres'})
  adminPassword: string;


  @IsBoolean({message: 'showProfile debe ser true o false'})
  showProfile: boolean;


  @IsBoolean({message: 'allowSelfRegistration debe ser true o false'})
  allowSelfRegistration: boolean;

  @IsBoolean({message: 'allowGoogleLogin debe ser true o false'})
  allowGoogleLogin: boolean;

  @IsBoolean({message: 'allowFacebookLogin debe ser true o false'})
  allowFacebookLogin: boolean;

  @IsNotEmpty({message: 'El loginMethod es requerido'})
  @IsString({message: 'El loginMethod debe ser una cadena de texto'})
  @IsIn(['email', 'document', 'both'], {message: 'El loginMethod debe ser: email o numero de indentificación'})
  loginMethod: string;

  @IsBoolean({message: 'allowValidationStatusUsers debe ser true o false'})
  allowValidationStatusUsers: boolean;

  @IsBoolean({message: 'requireLastName debe ser true o false'})
  requireLastName: boolean;

  @IsBoolean({message: 'requirePhone debe ser true o false'})
  requirePhone: boolean;

  @IsBoolean({message: 'requireDocumentType debe ser true o false'})
  requireDocumentType: boolean;

  @IsBoolean({message: 'requireDocument debe ser true o false'})
  requireDocument: boolean;

  @IsBoolean({message: 'requireOrganization debe ser true o false'})
  requireOrganization: boolean;

  @IsBoolean({message: 'requirePosition debe ser true o false'})
  requirePosition: boolean;

  @IsBoolean({message: 'requireGender debe ser true o false'})
  requireGender: boolean;

  @IsBoolean({message: 'requireCity debe ser true o false'})
  requireCity: boolean;

  @IsBoolean({message: 'requireAddress debe ser true o false'})
  requireAddress: boolean;

  @IsBoolean({message: 'enableEmailNotifications debe ser true o false'})
  enableEmailNotifications: boolean;
}
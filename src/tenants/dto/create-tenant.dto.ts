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

  @IsNotEmpty({ message: 'El city es requerido' })
  @IsString({ message: 'El city debe ser una cadena de texto' })
  city: string;

  @IsNotEmpty({ message: 'El country es requerido' })
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
  nit: String;

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
  @IsString({message: 'El showNotifications debe ser boolean'})
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


}
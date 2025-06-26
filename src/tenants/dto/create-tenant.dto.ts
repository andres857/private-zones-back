import { 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  Matches, 
  Length,
  IsIn, 
  IsNumber
} from 'class-validator';

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


}
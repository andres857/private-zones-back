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
    ValidateNested,
    IsUUID
} from 'class-validator';
// import { ViewType } from '../entities/tenant-view-config.entity';

// export class ViewSettingsDto {
//   @IsIn(Object.values(ViewType), { message: 'El tipo de vista no es válido' })
//   type: ViewType;

//   @IsBoolean({message: 'customBackground debe ser true o false'})
//   customBackground: boolean;

//   @IsOptional()
//   @IsIn(['image', 'color', 'none'], {
//     message: 'El backgroundType debe ser: image, color o none',
//   })
//   backgroundType?: 'image' | 'color' | 'none';

//   @IsOptional()
//   @IsString()
//   backgroundImage?: string;

//   @IsOptional()
//   @IsString()
//   backgroundColor?: string;
// }

export class CreateSectionDto {
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

    @IsOptional()
    @IsString({ message: 'La descripcion debe ser una cadena de texto' })
    @Length(0, 800, { message: 'La descripcion no puede exceder los 800 caracteres' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'La ruta de la imagen debe ser una cadena de texto' })
    thumbnailImagePath?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El orden debe ser un número' })
    order?: number;

    @IsOptional()
    @IsBoolean({ message: 'allowBanner debe ser true o false' })
    allowBanner?: boolean;

    @IsOptional()
    @IsString({ message: 'La ruta del banner debe ser una cadena de texto' })
    bannerPath?: string;

    @IsNotEmpty({ message: 'El tenantId es requerido' })
    @IsString({ message: 'El tenantId debe ser una cadena de texto' })
    tenantId: string;

    @IsOptional()
    config ?: {
        status?: boolean;
        primaryColor?: string;
        secondaryColor?: string;
        maxUsers?: number;
        storageLimit?: number;
    }

    @IsOptional()
    @IsArray()
    // @IsUUID('4', { each: true })
    courseIds?: string[];
}
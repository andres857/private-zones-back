import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { ContentType } from "src/common/enums/contents.enum";



export class CreateContentDto {
    @IsNotEmpty({ message: 'El nombre del curso es requerido' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    title: string;

    @IsOptional()
    description?: string;

    @IsNotEmpty({ message: 'El tipo de contenido es requerido' })
    @IsString({ message: 'El tipo de contenido debe ser una cadena de texto' })
    type: ContentType;

    @IsNotEmpty({ message: 'La URL del contenido es requerida' })
    @IsString({ message: 'La URL del contenido debe ser una cadena de texto'})
    contentUrl?: string;


    @IsNotEmpty({ message: 'El ID del curso es requerido' })
    @IsString({ message: 'El ID del curso debe ser una cadena de texto'})
    courseId: string;

    @IsOptional()
    order?: number;

    @IsOptional()
    metadata?: Record<string, any>;

    @IsNotEmpty({ message: 'El tenantId es requerido' })
    @IsString({ message: 'El tenantId debe ser una cadena de texto' })
    tenantId: string;
}
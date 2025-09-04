import { IsNotEmpty, IsNumber, IsOptional, IsString, Length } from "class-validator";

export class CreateModuleDto {
    @IsNotEmpty({ message: 'El nombre del curso es requerido' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    title: string;

    @IsOptional()
    description?: string;

    @IsNotEmpty({ message: 'El ID del curso es requerido' })
    @IsString({ message: 'El ID del curso debe ser una cadena de texto'})
    courseId: string;

    @IsOptional()
    thumbnailImagePath?: string;

    @IsOptional()
    order?: number;

    @IsOptional()
    configuration?: Record<string, any>;

    @IsOptional()
    items?: Record<string, any>[];

    @IsOptional()
    metadata?: Record<string, any>;

    @IsOptional()
    @IsNumber({}, { message: 'El porcentaje de aprobación debe ser un número' })
    approvalPercentage: number;

    @IsNotEmpty({ message: 'El tenantId es requerido' })
    @IsString({ message: 'El tenantId debe ser una cadena de texto' })
    tenantId: string;
}

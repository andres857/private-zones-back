import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";



export class CreateForumDto {
    
    @IsNotEmpty({ message: 'El id del curso es requerido' })
    courseId: string;

    @IsNotEmpty({ message: 'El titulo del Forum es requerido' })
    @IsString({ message: 'El titulo debe ser una cadena de texto' })
    @Length(2, 100, { message: 'El titulo debe tener entre 2 y 100 caracteres' })
    title: string;

    @IsOptional()
    description?: string;

    @IsOptional()
    thumbnail?: string;
    
    @IsOptional()
    expirationDate?: Date;

    @IsOptional()
    isActive?: boolean;
    
    @IsOptional()
    isPinned?: boolean;

    @IsOptional()
    category?: string;

    @IsOptional()
    tags?: string[];

    @IsOptional()
    viewCount?: number;

    @IsNotEmpty({ message: 'El ID del autor es requerido' })
    @IsString({ message: 'El ID del autor debe ser una cadena de texto' })
    authorId: string;

    @IsNotEmpty({ message: 'El tenantId es requerido' })
    @IsString({ message: 'El tenantId debe ser una cadena de texto' })
    tenantId: string;
}
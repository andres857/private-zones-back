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
  IsObject
} from 'class-validator';
import { CourseTranslationDto, CourseTranslationsDto } from './course-translation.dto';

export class CreateCourseDto {

    @IsNotEmpty({ message: 'El nombre del curso es requerido' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    title: string;

    @IsNotEmpty({ message: 'El slug del curso es requerido' })
    slug?: string;

    @IsNotEmpty({ message: 'El tenant del curso es requerido' })
    @IsString({ message: 'El tenant debe ser una cadena de texto' })
    tenantId: string;
    
    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;
    

    @IsOptional()
    @IsString({ message: 'La visibilidad debe ser booleano' })
    visibility?: boolean;

    @IsOptional()
    @IsString({message: 'subCategory debe ser una cadena de texto'})
    subcategory?: string;

    @IsOptional()
    @IsString({message: 'El acronimo debe ser una cadena de texto'})
    acronym?: string;

    @IsOptional()
    @IsString({message: 'el codigo debe ser una cadena de texto'})
    code?: string;

    @IsOptional()
    @IsNumber({}, { message: 'La intesidad debe ser un numero'})
    intensity?: number;

    @IsOptional()
    @IsNumber({}, {message: 'Las horas estimadas deben ser un numero'})
    estimatedHours?: number;

    @IsOptional()
    @IsString({message: 'El estado deber ser una cadena de texto'})
    status?: string;

    @IsOptional()
    @IsString({message: 'El color del titulo debe ser una cadena de texto'})
    colorTitle?: string;

    @IsOptional()
    @IsNumber({}, {message: 'El orden debe ser un numero'})
    order?: number;

    @IsOptional()
    @IsString({message: 'La fecha de inicio deber ser una cadena de texto'})
    startDate?: string;

    @IsOptional()
    @IsString({message: 'La fecha de fin deber ser una cadena de texto'})
    endDate?: string;

    @IsOptional()
    @IsString({message: 'La fecha de inicio de inscripcion deber ser una cadena de texto'})
    enrollmentStartDate?: string

    @IsOptional()
    @IsString({message: 'La fecha de fin de inscripcion deber ser una cadena de texto'})
    enrollmentEndDate?: string;

    @IsOptional()
    @IsNumber({}, {message: 'El maximo de estudiantes debe ser un numero'})
    maxEnrollments?: number;

    @IsOptional()
    @IsBoolean({ message: 'El requiere aprobacion de inscripcion debe ser booleano' })
    requiresApproval?: boolean;

    @IsOptional()
    @IsBoolean({message: 'La autoinscripcion debe ser booleano'})
    allowSelfEnrollment?: boolean;

    @IsOptional()
    @IsString({message: 'El link de invitacion debe ser una cadena de texto'})
    invitationLink?: string;

    @IsOptional()
    @IsString({message: 'La imagen de cover debe ser una cadena de texto'})
    coverImageUrl?: string;

    @IsOptional()
    @IsString({message: 'La imagen de menu debe ser una cadena de texto'})
    menuImageUrl?: string;

    @IsOptional()
    @IsString({message: 'La iamgen de thumbail debe ser una cadena de texto'})
    thumbnailImageUrl?: string;

    @IsOptional()
    @IsString({message: 'El titulo en ingles debe ser una cadena de texto'})
    titleEn?: string;

    @IsOptional()
    @IsString({message: 'La descripcion en ingles debe ser una cadena de texto'})
    descriptionEn?: string;

    @IsOptional()
    @IsString({message: 'Los tags en ingles deben ser una cadena de texto'})
    tagsEn?: string;

    @IsOptional()
    @IsString({message: 'El tags en español debe ser una cadena de texto'})
    tagsEs?: string;

    @IsOptional()
    @IsString({message: 'Las palabras claves en español deben ser una cadena de texto'})
    keywordsEs?: string;

    @IsOptional()
    @IsString({message: 'Las palabras claves en ingles deben ser una cadena de texto'})
    keywordsEn?: string;

    @IsOptional()
    @IsBoolean({message: 'El activador de la vista de contenidos debe ser un booleano'})
    contentsViewActive?: boolean;
    
    @IsOptional()
    @IsString({message: 'El tipo de fondo en contenidos debe ser una cadena de texto'})
    contentsBackgroundType?: string;

    @IsOptional()
    @IsString({message: 'El color de fondo en contenidos debe ser una cadena de texto'})
    contentsBackgroundColor?: string;

    @IsOptional()
    @IsString({message: 'El titulo personalizado en contenidos debe ser una cadena de texto'})
    contentsCustomTitle?: string;

    @IsOptional()
    @IsBoolean({message: 'El activador de la vista de foros debe ser un booleano'})
    forumsViewActive?: boolean;

    @IsOptional()
    @IsObject({ message: 'Las traducciones deben ser un objeto con códigos de idioma como claves' })
    @ValidateNested({ each: true })
    @Type(() => CourseTranslationsDto)
    translations?: Record<string, CourseTranslationsDto>;

    @IsOptional()
    @IsString({ 'message': 'El coverImageUrl debe ser una cadena de texto' })
    coverImage: string;

    @IsOptional()
    @IsString({ 'message': 'El menuImage debe ser una cadena de texto' })
    menuImage: string;

    @IsOptional()
    @IsString({ 'message': 'El thumbnailImage debe ser una cadena de texto' })
    thumbnailImage: string;

    @IsOptional()
    created_at?: string;

    @IsOptional()
    updated_at?: string;

    @IsOptional()
    deleted_at?: string;
}
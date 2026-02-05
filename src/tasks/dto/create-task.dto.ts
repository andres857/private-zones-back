// src/courses/dto/create-task.dto.ts
import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsBoolean, 
  IsDateString, 
  IsArray, 
  Min, 
  Max, 
  Length,
  ValidateNested,
  IsInt
} from "class-validator";
import { Transform, Type } from 'class-transformer';
import { TaskStatus } from "../../tasks/entities/courses-tasks.entity";

export class TaskConfigDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSupportResources?: boolean;

  @IsOptional()
  @IsBoolean()
  showResourcesBeforeSubmission?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSelfAssessment?: boolean;

  @IsOptional()
  @IsBoolean()
  requireSelfAssessmentBeforeSubmit?: boolean;

  @IsOptional()
  @IsBoolean()
  enableFileUpload?: boolean;

  @IsOptional()
  @IsBoolean()
  requireFileUpload?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTextSubmission?: boolean;

  @IsOptional()
  @IsBoolean()
  requireTextSubmission?: boolean;

  @IsOptional()
  @IsBoolean()
  showToStudentsBeforeStart?: boolean;

  @IsOptional()
  @IsBoolean()
  sendReminderBeforeDue?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168) // Máximo 1 semana
  reminderHoursBeforeDue?: number;

  @IsOptional()
  @IsBoolean()
  notifyOnGrade?: boolean;

  @IsOptional()
  @IsBoolean()
  isAutoGradable?: boolean;

  @IsOptional()
  @IsBoolean()
  requireGradeComment?: boolean;

  @IsOptional()
  @IsBoolean()
  enableGradeRubric?: boolean;

  @IsOptional()
  rubricData?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  showOtherSubmissions?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymizeSubmissions?: boolean;

  @IsOptional()
  @IsBoolean()
  enableGroupSubmission?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10)
  maxGroupSize?: number;

  @IsOptional()
  @IsBoolean()
  enableVersionControl?: boolean;

  @IsOptional()
  @IsBoolean()
  lockAfterGrade?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateTaskDto {
  @IsNotEmpty({ message: 'El título de la tarea es requerido' })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @Length(3, 200, { message: 'El título debe tener entre 3 y 200 caracteres' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Length(0, 5000, { message: 'La descripción no puede exceder 5000 caracteres' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Las instrucciones deben ser una cadena de texto' })
  instructions?: string;

  @IsNotEmpty({ message: 'El ID del curso es requerido' })
  @IsString({ message: 'El ID del curso debe ser una cadena de texto' })
  courseId: string;

  @IsNotEmpty({ message: 'El tenantId es requerido' })
  @IsString({ message: 'El tenantId debe ser una cadena de texto' })
  tenantId: string;

  @IsOptional()
  @IsString({ message: 'El ID del creador debe ser una cadena de texto' })
  createdBy?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Estado inválido' })
  status?: TaskStatus;

  // Fechas
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  startDate?: string;

  @IsNotEmpty({ message: 'La fecha de entrega es requerida' })
  @IsDateString({}, { message: 'La fecha de entrega debe ser una fecha válida' })
  endDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega tardía debe ser una fecha válida' })
  @Transform(({ value }) => value === '' ? undefined : value)
  lateSubmissionDate?: string;

  // Calificación
  @IsOptional()
  @IsNumber({}, { message: 'Los puntos máximos deben ser un número' })
  @Min(0, { message: 'Los puntos máximos no pueden ser negativos' })
  @Max(1000, { message: 'Los puntos máximos no pueden exceder 1000' })
  maxPoints?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La penalización debe ser un número' })
  @Min(0, { message: 'La penalización no puede ser negativa' })
  @Max(100, { message: 'La penalización no puede exceder 100%' })
  lateSubmissionPenalty?: number;

  // Configuración de archivos
  @IsOptional()
  @IsInt({ message: 'El máximo de archivos debe ser un número entero' })
  @Min(1, { message: 'Debe permitir al menos 1 archivo' })
  @Max(20, { message: 'No puede exceder 20 archivos' })
  maxFileUploads?: number;

  @IsOptional()
  @IsInt({ message: 'El tamaño máximo debe ser un número entero' })
  @Min(1, { message: 'El tamaño mínimo es 1 MB' })
  @Max(100, { message: 'El tamaño máximo es 100 MB' })
  maxFileSize?: number;

  @IsOptional()
  @IsArray({ message: 'Los tipos de archivo permitidos deben ser un array' })
  @IsString({ each: true, message: 'Cada tipo de archivo debe ser una cadena' })
  allowedFileTypes?: string[];

  // Configuración de envíos
  @IsOptional()
  @IsBoolean({ message: 'allowMultipleSubmissions debe ser booleano' })
  allowMultipleSubmissions?: boolean;

  @IsOptional()
  @IsInt({ message: 'El máximo de intentos debe ser un número entero' })
  @Min(1, { message: 'Debe permitir al menos 1 intento' })
  @Max(10, { message: 'No puede exceder 10 intentos' })
  maxSubmissionAttempts?: number;

  @IsOptional()
  @IsBoolean({ message: 'requireSubmission debe ser booleano' })
  requireSubmission?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'enablePeerReview debe ser booleano' })
  enablePeerReview?: boolean;

  // Visualización
  @IsOptional()
  @IsString({ message: 'La ruta de la miniatura debe ser una cadena' })
  thumbnailImagePath?: string;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  order?: number;

  @IsOptional()
  @IsBoolean({ message: 'showGradeToStudent debe ser booleano' })
  showGradeToStudent?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'showFeedbackToStudent debe ser booleano' })
  showFeedbackToStudent?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'notifyOnSubmission debe ser booleano' })
  notifyOnSubmission?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isAutoGradable?: boolean;

  // Configuración anidada
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskConfigDto)
  configuration?: TaskConfigDto;
}
import {
    IsString, IsEnum, IsBoolean, IsNumber, IsOptional,
    IsArray, ValidateNested, IsNotEmpty, MinLength, MaxLength,
    IsObject, Min, Max, IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentType, AssessmentStatus } from '../entities/assessment.entity';
import { GradingMethod, QuestionOrderMode } from '../entities/assessment-config.entity';

export class CreateAssessmentTranslationDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(10)
    languageCode: string; // 'es', 'en', etc.

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    instructions?: string;

    @IsString()
    @IsOptional()
    successMessage?: string;

    @IsString()
    @IsOptional()
    failureMessage?: string;

    @IsString()
    @IsOptional()
    welcomeMessage?: string;

    @IsString()
    @IsOptional()
    completionMessage?: string;
}

export class CreateAssessmentConfigurationDto {
    // Configuración de calificación
    @IsBoolean()
    @IsOptional()
    isGradable?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(GradingMethod)
    @IsOptional()
    gradingMethod?: GradingMethod;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    passingScore?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    maxScore?: number;

    // Configuración de certificados
    @IsBoolean()
    @IsOptional()
    generatesCertificate?: boolean;

    @IsString()
    @IsOptional()
    certificateTemplateId?: string;

    @IsBoolean()
    @IsOptional()
    requirePassingScoreForCertificate?: boolean;

    // Configuración de preguntas adicionales
    @IsBoolean()
    @IsOptional()
    hasAdditionalQuestions?: boolean;

    @IsString()
    @IsOptional()
    additionalQuestionsPosition?: string; // 'start', 'end', 'mixed'

    @IsString()
    @IsOptional()
    additionalQuestionsInstructions?: string;

    // Configuración de intentos
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxAttempts?: number; // 0 = ilimitado

    @IsBoolean()
    @IsOptional()
    allowReview?: boolean;

    @IsBoolean()
    @IsOptional()
    showCorrectAnswers?: boolean;

    @IsBoolean()
    @IsOptional()
    showScoreImmediately?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    timeBetweenAttempts?: number; // minutos

    // Configuración de tiempo
    @IsNumber()
    @IsOptional()
    @Min(1)
    timeLimit?: number; // minutos

    @IsBoolean()
    @IsOptional()
    strictTimeLimit?: boolean;

    // Configuración de preguntas
    @IsEnum(QuestionOrderMode)
    @IsOptional()
    questionOrderMode?: QuestionOrderMode;

    @IsBoolean()
    @IsOptional()
    randomizeOptions?: boolean;

    @IsBoolean()
    @IsOptional()
    oneQuestionPerPage?: boolean;

    @IsBoolean()
    @IsOptional()
    allowNavigationBetweenQuestions?: boolean;

    // Fechas de disponibilidad
    @IsDateString()
    @IsOptional()
    availableFrom?: string;

    @IsDateString()
    @IsOptional()
    availableUntil?: string;

    @IsDateString()
    @IsOptional()
    gradeReleaseDate?: string;

    // Configuración de acceso
    @IsBoolean()
    @IsOptional()
    requirePassword?: boolean;

    @IsString()
    @IsOptional()
    accessPassword?: string;

    @IsBoolean()
    @IsOptional()
    requireProctoring?: boolean;

    @IsBoolean()
    @IsOptional()
    preventTabSwitching?: boolean;

    @IsBoolean()
    @IsOptional()
    fullscreenMode?: boolean;

    // Configuración de feedback
    @IsBoolean()
    @IsOptional()
    showFeedbackAfterQuestion?: boolean;

    @IsBoolean()
    @IsOptional()
    showFeedbackAfterCompletion?: boolean;

    @IsString()
    @IsOptional()
    customPassMessage?: string;

    @IsString()
    @IsOptional()
    customFailMessage?: string;

    // Configuración de notificaciones
    @IsBoolean()
    @IsOptional()
    notifyInstructorOnCompletion?: boolean;

    @IsBoolean()
    @IsOptional()
    notifyInstructorOnNewAttempt?: boolean;

    // Metadatos adicionales
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class CreateAssessmentDto {
    @IsString()
    @IsNotEmpty()
    courseId: string;

    @IsString()
    @IsOptional()
    tenantId: string;

    @IsEnum(AssessmentType)
    @IsOptional()
    type?: AssessmentType;

    @IsEnum(AssessmentStatus)
    @IsOptional()
    status?: AssessmentStatus;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAssessmentTranslationDto)
    @IsNotEmpty()
    translations: CreateAssessmentTranslationDto[];

    @ValidateNested()
    @Type(() => CreateAssessmentConfigurationDto)
    @IsOptional()
    configuration?: CreateAssessmentConfigurationDto;
}
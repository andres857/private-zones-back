import {
    IsString, IsEnum, IsBoolean, IsNumber, IsOptional,
    IsArray, ValidateNested, IsNotEmpty, MinLength, MaxLength,
    Min, Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionDifficulty } from '../entities/assessment-question.entity';

// DTO para traducciones de opciones
export class CreateQuestionOptionTranslationDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(10)
    languageCode: string;

    @IsString()
    @IsNotEmpty()
    optionText: string;

    @IsString()
    @IsOptional()
    feedback?: string;
}

// DTO para opciones de pregunta
export class CreateQuestionOptionDto {
    @IsString()
    @IsOptional()
    id?: string; // ID temporal del frontend (se ignora en el backend)

    @IsNumber()
    @IsOptional()
    @Min(0)
    order?: number;

    @IsBoolean()
    @IsOptional()
    isCorrect?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    partialCreditPercentage?: number;

    @IsString()
    @IsOptional()
    matchingPairId?: string;

    @IsString()
    @IsOptional()
    matchingGroup?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionOptionTranslationDto)
    @IsNotEmpty()
    translations: CreateQuestionOptionTranslationDto[];
}

// DTO para traducciones de pregunta
export class CreateQuestionTranslationDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(10)
    languageCode: string;

    @IsString()
    @IsNotEmpty()
    questionText: string;

    @IsString()
    @IsOptional()
    hint?: string;

    @IsString()
    @IsOptional()
    feedback?: string;

    @IsString()
    @IsOptional()
    correctFeedback?: string;

    @IsString()
    @IsOptional()
    incorrectFeedback?: string;

    @IsString()
    @IsOptional()
    explanation?: string;
}

// DTO para crear pregunta
export class CreateQuestionDto {
    @IsString()
    @IsOptional()
    id?: string; // ID temporal del frontend (se ignora en el backend)

    @IsEnum(QuestionType)
    type: QuestionType;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order?: number;

    @IsBoolean()
    @IsOptional()
    isGradable?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    points?: number;

    @IsEnum(QuestionDifficulty)
    @IsOptional()
    difficulty?: QuestionDifficulty;

    @IsBoolean()
    @IsOptional()
    isRequired?: boolean;

    @IsBoolean()
    @IsOptional()
    allowPartialCredit?: boolean;

    @IsBoolean()
    @IsOptional()
    caseSensitive?: boolean;

    @IsNumber()
    @IsOptional()
    minLength?: number;

    @IsNumber()
    @IsOptional()
    maxLength?: number;

    @IsNumber()
    @IsOptional()
    scaleMin?: number;

    @IsNumber()
    @IsOptional()
    scaleMax?: number;

    @IsNumber()
    @IsOptional()
    scaleStep?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    tag?: string;

    @IsString()
    @IsOptional()
    randomGroup?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionTranslationDto)
    @IsNotEmpty()
    translations: CreateQuestionTranslationDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionOptionDto)
    @IsOptional()
    options?: CreateQuestionOptionDto[];
}

// DTO para crear/actualizar múltiples preguntas
export class SaveQuestionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    @IsNotEmpty()
    questions: CreateQuestionDto[];
}
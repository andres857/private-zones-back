// src/activities/dto/create-activity.dto.ts
import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, ActivityStatus, ActivityDifficulty } from '../entities/activity.entity';

export class ActivityTranslationDto {
    @IsString()
    languageCode: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsString()
    welcomeMessage?: string;

    @IsOptional()
    @IsString()
    completionMessage?: string;
}

export class ActivityConfigurationDto {
    @IsOptional()
    @IsNumber()
    timeLimit?: number;

    @IsOptional()
    @IsBoolean()
    strictTimeLimit?: boolean;

    @IsOptional()
    @IsNumber()
    maxAttempts?: number;

    @IsOptional()
    @IsNumber()
    timeBetweenAttempts?: number;

    @IsOptional()
    @IsBoolean()
    showTimer?: boolean;

    @IsOptional()
    @IsBoolean()
    showScore?: boolean;

    @IsOptional()
    @IsBoolean()
    showHints?: boolean;

    @IsOptional()
    @IsNumber()
    maxHints?: number;

    @IsOptional()
    @IsBoolean()
    isGradable?: boolean;

    @IsOptional()
    @IsNumber()
    passingScore?: number;

    @IsOptional()
    @IsBoolean()
    showScoreImmediately?: boolean;

    @IsOptional()
    @IsDateString()
    availableFrom?: Date;

    @IsOptional()
    @IsDateString()
    availableUntil?: Date;

    @IsOptional()
    @IsBoolean()
    showFeedbackAfterCompletion?: boolean;

    @IsOptional()
    @IsString()
    customSuccessMessage?: string;

    @IsOptional()
    @IsString()
    customFailMessage?: string;

    @IsOptional()
    @IsBoolean()
    awardBadges?: boolean;

    @IsOptional()
    @IsBoolean()
    showLeaderboard?: boolean;

    @IsOptional()
    @IsBoolean()
    notifyInstructorOnCompletion?: boolean;

    @IsOptional()
    gameData?: Record<string, any>;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class CreateActivityDto {
    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    courseId: string;

    @IsString()
    tenantId: string;

    @IsEnum(ActivityType)
    type: ActivityType;

    @IsOptional()
    @IsEnum(ActivityStatus)
    status?: ActivityStatus;

    @IsOptional()
    @IsEnum(ActivityDifficulty)
    difficulty?: ActivityDifficulty;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsNumber()
    maxScore?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ActivityTranslationDto)
    translations: ActivityTranslationDto[];

    @ValidateNested()
    @Type(() => ActivityConfigurationDto)
    configuration: ActivityConfigurationDto;
}
// src/activities/games/crossword/dto/create-crossword.dto.ts
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CrosswordDirection } from '../entities/crossword.entity';

export class CrosswordWordDto {
    @IsInt()
    @Min(1)
    number: number;

    @IsString()
    word: string;

    @IsString()
    clue: string;

    @IsEnum(CrosswordDirection)
    direction: CrosswordDirection;

    @IsInt()
    @Min(0)
    row: number;

    @IsInt()
    @Min(0)
    col: number;
}

export class CreateCrosswordDto {
    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(30)
    gridWidth?: number;

    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(30)
    gridHeight?: number;

    @IsOptional()
    @IsString()
    seed?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CrosswordWordDto)
    words: CrosswordWordDto[];

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showClueNumbers?: boolean;

    @IsOptional()
    @IsBoolean()
    allowCheckLetter?: boolean;

    @IsOptional()
    @IsBoolean()
    allowCheckWord?: boolean;

    @IsOptional()
    @IsBoolean()
    autoCheckOnComplete?: boolean;

    @IsOptional()
    @IsInt()
    pointsPerWord?: number;

    @IsOptional()
    @IsInt()
    bonusForPerfect?: number;

    @IsOptional()
    @IsInt()
    penaltyPerCheck?: number;

    @IsOptional()
    @IsInt()
    penaltyPerHint?: number;
}

export class UpdateCrosswordDto {
    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(30)
    gridWidth?: number;

    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(30)
    gridHeight?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CrosswordWordDto)
    words?: CrosswordWordDto[];

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showClueNumbers?: boolean;

    @IsOptional()
    @IsBoolean()
    allowCheckLetter?: boolean;

    @IsOptional()
    @IsBoolean()
    allowCheckWord?: boolean;

    @IsOptional()
    @IsBoolean()
    autoCheckOnComplete?: boolean;

    @IsOptional()
    @IsInt()
    pointsPerWord?: number;

    @IsOptional()
    @IsInt()
    bonusForPerfect?: number;

    @IsOptional()
    @IsInt()
    penaltyPerCheck?: number;

    @IsOptional()
    @IsInt()
    penaltyPerHint?: number;
}
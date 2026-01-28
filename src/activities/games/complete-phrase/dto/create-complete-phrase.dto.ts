// src/activities/games/complete-phrase/dto/create-complete-phrase.dto.ts
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BlankType } from '../entities/complete-phrase.entity';

export class BlankOptionDto {
    @IsString()
    text: string;

    @IsBoolean()
    isCorrect: boolean;
}

export class PhraseBlankDto {
    @IsInt()
    id: number;

    @IsEnum(BlankType)
    type: BlankType;

    @IsString()
    correctAnswer: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BlankOptionDto)
    options?: BlankOptionDto[];

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    acceptSynonyms?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    synonyms?: string[];
}

export class CompletePhraseItemDto {
    @IsString()
    phrase: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PhraseBlankDto)
    blanks: PhraseBlankDto[];

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    difficulty?: string;

    @IsOptional()
    @IsString()
    hint?: string;
}

export class CreateCompletePhraseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CompletePhraseItemDto)
    phrases: CompletePhraseItemDto[];

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showHints?: boolean;

    @IsOptional()
    @IsBoolean()
    shuffleOptions?: boolean;

    @IsOptional()
    @IsBoolean()
    allowPartialCredit?: boolean;

    @IsOptional()
    @IsInt()
    pointsPerBlank?: number;

    @IsOptional()
    @IsInt()
    bonusForPerfect?: number;

    @IsOptional()
    @IsInt()
    penaltyPerError?: number;

    @IsOptional()
    @IsInt()
    penaltyPerHint?: number;
}

export class UpdateCompletePhraseDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CompletePhraseItemDto)
    phrases?: CompletePhraseItemDto[];

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showHints?: boolean;

    @IsOptional()
    @IsBoolean()
    shuffleOptions?: boolean;

    @IsOptional()
    @IsBoolean()
    allowPartialCredit?: boolean;

    @IsOptional()
    @IsInt()
    pointsPerBlank?: number;

    @IsOptional()
    @IsInt()
    bonusForPerfect?: number;

    @IsOptional()
    @IsInt()
    penaltyPerError?: number;

    @IsOptional()
    @IsInt()
    penaltyPerHint?: number;
}
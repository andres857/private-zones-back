// src/activities/games/hanging/dto/create-hanging.dto.ts
import { IsArray, IsBoolean, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HangingWordDto {
    word: string;
    category?: string;
    clue?: string;
}

export class CreateHangingDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HangingWordDto)
    words: HangingWordDto[];

    @IsOptional()
    @IsInt()
    @Min(1)
    maxAttempts?: number;

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showCategory?: boolean;

    @IsOptional()
    @IsBoolean()
    showWordLength?: boolean;

    @IsOptional()
    @IsInt()
    pointsPerWord?: number;

    @IsOptional()
    @IsInt()
    bonusForNoErrors?: number;

    @IsOptional()
    @IsInt()
    penaltyPerError?: number;

    @IsOptional()
    @IsInt()
    penaltyPerHint?: number;
}

export class UpdateHangingDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HangingWordDto)
    words?: HangingWordDto[];

    @IsOptional()
    @IsInt()
    @Min(1)
    maxAttempts?: number;

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showCategory?: boolean;

    @IsOptional()
    @IsBoolean()
    showWordLength?: boolean;

    @IsOptional()
    @IsInt()
    pointsPerWord?: number;

    @IsOptional()
    @IsInt()
    bonusForNoErrors?: number;

    @IsOptional()
    @IsInt()
    penaltyPerError?: number;

    @IsOptional()
    @IsInt()
    penaltyPerHint?: number;
}
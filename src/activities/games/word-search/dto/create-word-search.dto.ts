// src/activities/games/word-search/dto/create-word-search.dto.ts
import {
    IsString, IsBoolean, IsOptional, IsNumber, IsArray,
    ValidateNested, IsEnum, Min, Max, MinLength, MaxLength,
    ArrayMinSize, ArrayMaxSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { WordDirection } from '../entities/word-search.entity';

/**
 * DTO para definir una palabra en la sopa de letras
 */
export class WordItemDto {
    @IsString()
    @MinLength(2, { message: 'La palabra debe tener al menos 2 caracteres' })
    @MaxLength(20, { message: 'La palabra no puede tener más de 20 caracteres' })
    word: string;

    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'La pista no puede tener más de 200 caracteres' })
    clue?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'La categoría no puede tener más de 50 caracteres' })
    category?: string;
}

/**
 * DTO para crear un juego de sopa de letras
 */
export class CreateWordSearchDto {

    @IsOptional()
    @IsString()
    tenantId?: string;

    /**
     * Ancho de la cuadrícula (10-30)
     */
    @IsNumber()
    @Min(10, { message: 'El ancho mínimo de la cuadrícula es 10' })
    @Max(30, { message: 'El ancho máximo de la cuadrícula es 30' })
    gridWidth: number;

    /**
     * Alto de la cuadrícula (10-30)
     */
    @IsNumber()
    @Min(10, { message: 'El alto mínimo de la cuadrícula es 10' })
    @Max(30, { message: 'El alto máximo de la cuadrícula es 30' })
    gridHeight: number;

    /**
     * Lista de palabras a buscar (mínimo 3, máximo 50)
     */
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe proporcionar al menos 1 palabra' })
    @ArrayMaxSize(50, { message: 'No puede agregar más de 50 palabras' })
    @ValidateNested({ each: true })
    @Type(() => WordItemDto)
    words: WordItemDto[];

    /**
     * Direcciones permitidas para colocar las palabras
     */
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe permitir al menos una dirección' })
    @IsEnum(WordDirection, {
        each: true,
        message: 'Direcciones válidas: horizontal, vertical, diagonal_down, diagonal_up, y sus reversas'
    })
    allowedDirections: WordDirection[];

    /**
     * Seed personalizado (opcional) - Si no se proporciona, se genera automáticamente
     */
    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(255)
    seed?: string;

    /**
     * Llenar celdas vacías con letras aleatorias
     * @default true
     */
    @IsOptional()
    @IsBoolean()
    fillEmptyCells?: boolean;

    /**
     * Búsqueda sensible a mayúsculas/minúsculas
     * @default false
     */
    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    /**
     * Mostrar la lista de palabras a buscar
     * @default true
     */
    @IsOptional()
    @IsBoolean()
    showWordList?: boolean;

    /**
     * Mostrar pistas en lugar de palabras
     * @default false
     */
    @IsOptional()
    @IsBoolean()
    showClues?: boolean;

    /**
     * Puntos por cada palabra encontrada
     * @default 10
     */
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Los puntos por palabra deben ser al menos 1' })
    @Max(100, { message: 'Los puntos por palabra no pueden exceder 100' })
    pointsPerWord?: number;

    /**
     * Bonus por velocidad
     * @default 5
     */
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'El bonus por velocidad no puede ser negativo' })
    @Max(50, { message: 'El bonus por velocidad no puede exceder 50' })
    bonusForSpeed?: number;

    /**
     * Penalización por usar pistas (número negativo)
     * @default -2
     */
    @IsOptional()
    @IsNumber()
    @Max(0, { message: 'La penalización debe ser un número negativo o cero' })
    @Min(-10, { message: 'La penalización no puede ser menor a -10' })
    penaltyPerHint?: number;
}

/**
 * DTO para actualizar un juego de sopa de letras
 */
export class UpdateWordSearchDto {
    @IsOptional()
    @IsNumber()
    @Min(10)
    @Max(30)
    gridWidth?: number;

    @IsOptional()
    @IsNumber()
    @Min(10)
    @Max(30)
    gridHeight?: number;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => WordItemDto)
    words?: WordItemDto[];

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsEnum(WordDirection, { each: true })
    allowedDirections?: WordDirection[];

    @IsOptional()
    @IsBoolean()
    fillEmptyCells?: boolean;

    @IsOptional()
    @IsBoolean()
    caseSensitive?: boolean;

    @IsOptional()
    @IsBoolean()
    showWordList?: boolean;

    @IsOptional()
    @IsBoolean()
    showClues?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    pointsPerWord?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(50)
    bonusForSpeed?: number;

    @IsOptional()
    @IsNumber()
    @Max(0)
    @Min(-10)
    penaltyPerHint?: number;
}
// dto/course-translation.dto.ts
import { IsOptional, IsString, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CourseTranslationMetadataDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @IsOptional()
    @IsObject()
    customFields?: Record<string, string>;
}

export class CourseTranslationDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CourseTranslationMetadataDto)
    metadata?: CourseTranslationMetadataDto;
}


export class CourseTranslationsDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => CourseTranslationDto)
    es?: CourseTranslationDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CourseTranslationDto)
    en?: CourseTranslationDto;
}
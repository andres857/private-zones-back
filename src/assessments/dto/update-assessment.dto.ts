// src/assessments/dto/update-assessment.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAssessmentDto, CreateAssessmentTranslationDto, CreateAssessmentConfigurationDto } from './create-assessment.dto';
import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAssessmentTranslationDto extends PartialType(CreateAssessmentTranslationDto) {
    @IsString()
    @IsOptional()
    id?: string; // Para identificar traducciones existentes
}

export class UpdateAssessmentConfigurationDto extends PartialType(CreateAssessmentConfigurationDto) {}

export class UpdateAssessmentDto extends PartialType(
    OmitType(CreateAssessmentDto, ['translations', 'configuration'] as const)
) {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAssessmentTranslationDto)
    @IsOptional()
    translations?: UpdateAssessmentTranslationDto[];

    @ValidateNested()
    @Type(() => UpdateAssessmentConfigurationDto)
    @IsOptional()
    configuration?: UpdateAssessmentConfigurationDto;
}
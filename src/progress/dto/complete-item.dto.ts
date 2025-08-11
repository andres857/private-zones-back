// src/progress/dto/complete-item.dto.ts
import { IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  timeSpent?: number;

  @IsOptional()
  @IsObject()
  responses?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
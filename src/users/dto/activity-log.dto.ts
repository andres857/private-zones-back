// src/progress/dto/activity-log.dto.ts
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ActivityType } from '../entities/user-activity-log.entity';

export class GetActivityLogDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @IsOptional()
  referenceId?: string;

  @IsOptional()
  referenceType?: string;
}

export class ActivityLogDto {
  @Expose()
  id: string;

  @Expose()
  activityType: ActivityType;

  @Expose()
  referenceId?: string;

  @Expose()
  referenceType?: string;

  @Expose()
  details: Record<string, any>;

  @Expose()
  createdAt: Date;
}
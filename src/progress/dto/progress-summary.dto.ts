// src/progress/dto/progress-summary.dto.ts
import { Type, Expose } from 'class-transformer';
import { CourseStatus } from '../entities/user-course-progress.entity';
import { ModuleStatus } from '../entities/user-module-progress.entity';
import { ItemStatus } from '../entities/user-item-progress.entity';

export class CompletionStatsDto {
  @Expose()
  totalItems: number;

  @Expose()
  completedItems: number;

  @Expose()
  progressPercentage: number;

  @Expose()
  totalModules: number;

  @Expose()
  completedModules: number;

  @Expose()
  averageScore: number;
}

export class CourseProgressDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  status: CourseStatus;

  @Expose()
  progressPercentage: number;

  @Expose()
  scorePercentage: number;

  @Expose()
  startedAt: Date;

  @Expose()
  completedAt?: Date;

  @Expose()
  lastAccessedAt?: Date;

  @Expose()
  totalTimeSpent: number;

  @Expose()
  totalModulesCompleted: number;

  @Expose()
  totalItemsCompleted: number;
}

export class ModuleProgressDto {
  @Expose()
  id: string;

  @Expose()
  moduleId: string;

  @Expose()
  status: ModuleStatus;

  @Expose()
  progressPercentage: number;

  @Expose()
  scorePercentage: number;

  @Expose()
  itemsCompleted: number;

  @Expose()
  totalItems: number;

  @Expose()
  timeSpent: number;

  @Expose()
  attempts: number;
}

export class ItemProgressDto {
  @Expose()
  id: string;

  @Expose()
  itemId: string;

  @Expose()
  status: ItemStatus;

  @Expose()
  score?: number;

  @Expose()
  progressPercentage: number;

  @Expose()
  timeSpent: number;

  @Expose()
  attempts: number;

  @Expose()
  bestScore?: number;
}

export class ProgressSummaryDto {
  @Type(() => CourseProgressDto)
  @Expose()
  courseProgress: CourseProgressDto;

  @Type(() => ModuleProgressDto)
  @Expose()
  moduleProgress: ModuleProgressDto[];

  @Type(() => ItemProgressDto)
  @Expose()
  itemProgress: ItemProgressDto[];

  @Type(() => CompletionStatsDto)
  @Expose()
  completionStats: CompletionStatsDto;
}
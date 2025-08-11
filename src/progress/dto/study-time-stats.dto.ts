// src/progress/dto/study-time-stats.dto.ts
import { Expose } from 'class-transformer';

export class StudyTimeStatsDto {
  @Expose()
  totalTime: number;

  @Expose()
  averageSessionTime: number;

  @Expose()
  totalSessions: number;

  @Expose()
  timeByModule: Record<string, number>;
}
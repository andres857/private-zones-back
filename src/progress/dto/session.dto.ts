// src/progress/dto/session.dto.ts
import { Expose } from 'class-transformer';

export class SessionDto {
  @Expose()
  id: string;

  @Expose()
  courseId?: string;

  @Expose()
  moduleId?: string;

  @Expose()
  itemId?: string;

  @Expose()
  startTime: Date;

  @Expose()
  endTime?: Date;

  @Expose()
  duration: number;

  @Expose()
  isActive: boolean;
}
// src/progress/dto/user-course-list.dto.ts
import { Type, Expose } from 'class-transformer';
import { CourseStatus } from '../entities/user-course-progress.entity';

export class UserCourseItemDto {
  @Expose()
  courseId: string;

  @Expose()
  courseTitle: string;

  @Expose()
  courseSlug: string;

  @Expose()
  status: CourseStatus;

  @Expose()
  progressPercentage: number;

  @Expose()
  scorePercentage: number;

  @Expose()
  started_at?: Date;

  @Expose()
  completed_at?: Date;

  @Expose()
  lastAccessedAt?: Date;
}

export class UserCourseListDto {
  @Type(() => UserCourseItemDto)
  @Expose()
  courses: UserCourseItemDto[];

  @Expose()
  totalCourses: number;

  @Expose()
  completedCourses: number;

  @Expose()
  inProgressCourses: number;
}

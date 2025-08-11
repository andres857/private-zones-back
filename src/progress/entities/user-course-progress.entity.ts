// src/progress/entities/user-course-progress.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Courses } from 'src/courses/entities/courses.entity';

export enum CourseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  FAILED = 'failed'
}

@Entity('user_course_progress')
@Unique(['userId', 'courseId'])
@Index(['userId', 'status'])
@Index(['courseId', 'status'])
export class UserCourseProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => Courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  @Column()
  @Index()
  courseId: string;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.NOT_STARTED })
  status: CourseStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scorePercentage: number; // 0-100

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @Column({ type: 'int', default: 0 })
  totalTimeSpent: number; // en segundos

  @Column({ type: 'int', default: 0 })
  totalModulesCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalModules: number;

  @Column({ type: 'int', default: 0 })
  totalItemsCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>; // Datos adicionales como certificaciones, badges, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos helper
  isCompleted(): boolean {
    return this.status === CourseStatus.COMPLETED;
  }

  isInProgress(): boolean {
    return this.status === CourseStatus.IN_PROGRESS;
  }

  calculateProgressPercentage(): number {
    if (this.totalItems === 0) return 0;
    return (this.totalItemsCompleted / this.totalItems) * 100;
  }
}
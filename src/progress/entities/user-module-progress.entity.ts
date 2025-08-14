// src/progress/entities/user-module-progress.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';

export enum ModuleStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('user_module_progress')
@Unique(['userId', 'moduleId'])
@Index(['userId', 'status'])
@Index(['moduleId', 'status'])
export class UserModuleProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => CourseModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: CourseModule;

  @Column()
  @Index()
  moduleId: string;

  @Column({ type: 'enum', enum: ModuleStatus, default: ModuleStatus.NOT_STARTED })
  status: ModuleStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scorePercentage: number; // 0-100

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // en segundos

  @Column({ type: 'int', default: 0 })
  itemsCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'int', default: 0 })
  attempts: number; // número de intentos para completar el módulo

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos helper
  isCompleted(): boolean {
    return this.status === ModuleStatus.COMPLETED;
  }

  hasPassedMinimumScore(minimumScore: number = 80): boolean {
    return this.scorePercentage >= minimumScore;
  }

  calculateProgressPercentage(): number {
    if (this.totalItems === 0) return 0;
    return (this.itemsCompleted / this.totalItems) * 100;
  }
}
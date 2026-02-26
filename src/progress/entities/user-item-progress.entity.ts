// src/progress/entities/user-item-progress.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ModuleItem } from 'src/courses/entities/courses-modules-item.entity';

export enum ItemStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed'
}

@Entity('user_item_progress')
@Unique(['userId', 'itemId'])
@Index(['userId', 'status'])
@Index(['itemId', 'status'])
export class UserItemProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => ModuleItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: ModuleItem;

  @Column()
  @Index()
  itemId: string;

  @Column({ type: 'enum', enum: ItemStatus, default: ItemStatus.NOT_STARTED })
  status: ItemStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number; // Para quizzes, tareas, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number; // Para contenidos con progreso parcial

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // en segundos

  @Column({ type: 'int', default: 0 })
  attempts: number; // para quizzes, tareas, etc.

  @Column({ type: 'int', nullable: true })
  bestScore: number; // mejor puntuación obtenida

  @Column({ type: 'jsonb', default: {} })
  responses: Record<string, any>; // Para almacenar respuestas de quizzes, encuestas, etc.

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>; // Datos específicos según el tipo de item

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos helper
  isCompleted(): boolean {
    return this.status === ItemStatus.COMPLETED;
  }

  hasPassedScore(passingScore: number): boolean {
    return this.score !== null && this.score >= passingScore;
  }

  incrementAttempt(): void {
    this.attempts += 1;
  }

  updateBestScore(newScore: number): void {
    if (this.bestScore === null || newScore > this.bestScore) {
      this.bestScore = newScore;
    }
  }

  updateBestProgress(newPercentage: number): void {
    if (newPercentage > this.progressPercentage) {
      this.progressPercentage = newPercentage;
    }
  }
}
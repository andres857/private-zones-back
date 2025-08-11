// src/progress/entities/user-activity-log.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

export enum ActivityType {
  COURSE_STARTED = 'course_started',
  COURSE_COMPLETED = 'course_completed',
  MODULE_STARTED = 'module_started',
  MODULE_COMPLETED = 'module_completed',
  ITEM_STARTED = 'item_started',
  ITEM_COMPLETED = 'item_completed',
  QUIZ_ATTEMPTED = 'quiz_attempted',
  TASK_SUBMITTED = 'task_submitted',
  FORUM_PARTICIPATION = 'forum_participation',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

@Entity('user_activity_log')
@Index(['userId', 'activityType'])
@Index(['referenceId', 'activityType'])
@Index(['createdAt'])
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: ActivityType })
  activityType: ActivityType;

  @Column({ nullable: true })
  @Index()
  referenceId: string; // ID del curso, módulo, item, etc.

  @Column({ nullable: true })
  referenceType: string; // 'course', 'module', 'item', etc.

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>; // Detalles específicos de la actividad

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
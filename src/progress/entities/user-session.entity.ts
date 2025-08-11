// src/progress/entities/user-session.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('user_sessions')
@Index(['userId', 'isActive'])
@Index(['courseId', 'isActive'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  @Index()
  courseId: string;

  @Column({ nullable: true })
  moduleId: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // en segundos

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método helper para finalizar sesión
  endSession(): void {
    this.endTime = new Date();
    this.isActive = false;
    this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
}
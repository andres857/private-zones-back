// src/activities/entities/activity-attempt.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn
} from 'typeorm';
import { Activity } from './activity.entity';
import { User } from 'src/users/entities/user.entity';

export enum AttemptStatus {
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
    EXPIRED = 'expired'
}

@Entity('activity_attempts')
export class ActivityAttempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Activity, activity => activity.attempts)
    @JoinColumn({ name: 'activityId' })
    activity: Activity;

    @Column()
    activityId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: AttemptStatus,
        default: AttemptStatus.IN_PROGRESS
    })
    status: AttemptStatus;

    @Column({ type: 'float', default: 0 })
    score: number; // Puntaje obtenido

    @Column({ type: 'float', nullable: true })
    percentage: number; // Porcentaje de completitud

    @Column({ default: false })
    passed: boolean; // Si aprobó (basado en passingScore)

    @Column({ nullable: true })
    timeSpent: number; // Tiempo gastado en segundos

    @Column({ default: 0 })
    hintsUsed: number; // Número de pistas utilizadas

    // Datos del intento (JSON) - específico por tipo de juego
    @Column({
        type: 'jsonb',
        default: {}
    })
    attemptData: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
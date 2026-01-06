// src/assessments/entities/assessment-attempt.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { User } from 'src/users/entities/user.entity';
import { AssessmentAttemptAnswer } from './assessment-attempt-answer.entity';

export enum AttemptStatus {
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
    GRADING = 'grading',
    GRADED = 'graded'
}

@Entity('assessment_attempts')
export class AssessmentAttempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Assessment, assessment => assessment.attempts, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'assessmentId' })
    assessment: Assessment;

    @Column()
    assessmentId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ default: 1 })
    attemptNumber: number; // Número del intento

    @Column({
        type: 'enum',
        enum: AttemptStatus,
        default: AttemptStatus.IN_PROGRESS
    })
    status: AttemptStatus;

    @Column({ nullable: true })
    startedAt: Date;

    @Column({ nullable: true })
    completedAt: Date;

    @Column({ nullable: true })
    submittedAt: Date;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    score: number; // Puntaje obtenido

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    percentage: number; // Porcentaje obtenido

    @Column({ nullable: true })
    passed: boolean; // Si aprobó o no

    @Column({ nullable: true })
    timeSpent: number; // Tiempo empleado en segundos

    @Column({ nullable: true })
    ipAddress: string; // Dirección IP

    @Column({ nullable: true })
    userAgent: string; // Navegador/dispositivo

    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>; // Datos adicionales (ej: proctoring info)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => AssessmentAttemptAnswer, answer => answer.attempt, {
        cascade: true
    })
    answers: AssessmentAttemptAnswer[];

    // Métodos helper
    isCompleted(): boolean {
        return this.status === AttemptStatus.COMPLETED ||
            this.status === AttemptStatus.GRADED;
    }

    calculateTimeSpent(): number {
        if (this.startedAt && this.completedAt) {
            return Math.floor(
                (this.completedAt.getTime() - this.startedAt.getTime()) / 1000
            );
        }
        return 0;
    }
}
// src/assessments/entities/assessment-session.entity.ts

import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('assessment_sessions')
export class AssessmentSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Assessment)
    @JoinColumn({ name: 'assessmentId' })
    assessment: Assessment;

    @Column()
    assessmentId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ unique: true })
    token: string;

    @Column()
    attemptId: string; // ID del intento que se creará

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ default: false })
    used: boolean; // Si el token ya fue usado

    @Column({ nullable: true })
    usedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    isValid(): boolean {
        return !this.used && !this.isExpired();
    }
}
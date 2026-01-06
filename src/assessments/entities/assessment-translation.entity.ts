// src/assessments/entities/assessment-translation.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Assessment } from './assessment.entity';

@Entity('assessment_translations')
export class AssessmentTranslation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Assessment, assessment => assessment.translations, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'assessmentId' })
    assessment: Assessment;

    @Column()
    assessmentId: string;

    @Column({ length: 10 })
    languageCode: string; // 'es', 'en', 'fr', etc.

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    instructions: string; // Instrucciones para el estudiante

    @Column({ type: 'text', nullable: true })
    welcomeMessage: string; // Mensaje de bienvenida

    @Column({ type: 'text', nullable: true })
    completionMessage: string; // Mensaje al completar

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
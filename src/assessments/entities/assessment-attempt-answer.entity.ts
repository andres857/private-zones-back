// src/assessments/entities/assessment-attempt-answer.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn
} from 'typeorm';
import { AssessmentAttempt } from './assessment-attempt.entity';
import { AssessmentQuestion } from './assessment-question.entity';
import { AssessmentQuestionOption } from './assessment-question-option.entity';

@Entity('assessment_attempt_answers')
export class AssessmentAttemptAnswer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssessmentAttempt, attempt => attempt.answers, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'attemptId' })
    attempt: AssessmentAttempt;

    @Column()
    attemptId: string;

    @ManyToOne(() => AssessmentQuestion)
    @JoinColumn({ name: 'questionId' })
    question: AssessmentQuestion;

    @Column()
    questionId: string;

    // Respuesta(s) seleccionada(s)
    @Column({ type: 'jsonb', nullable: true })
    selectedOptionIds: string[]; // IDs de opciones seleccionadas

    @Column({ type: 'text', nullable: true })
    textAnswer: string; // Respuesta de texto libre

    @Column({ type: 'jsonb', nullable: true })
    orderingAnswer: string[]; // Orden de respuestas

    @Column({ type: 'jsonb', nullable: true })
    matchingAnswer: Record<string, string>; // Pares de emparejamiento

    @Column({ type: 'jsonb', nullable: true })
    fillInBlankAnswer: string[]; // Respuestas de espacios en blanco

    // Calificación
    @Column({ default: false })
    isCorrect: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    pointsEarned: number; // Puntos obtenidos

    @Column({ default: false })
    manuallyGraded: boolean; // Si fue calificada manualmente

    @Column({ nullable: true })
    gradedBy: string; // ID del usuario que calificó

    @Column({ nullable: true })
    gradedAt: Date;

    @Column({ type: 'text', nullable: true })
    feedback: string; // Retroalimentación del instructor

    @Column({ nullable: true })
    timeSpent: number; // Tiempo empleado en esta pregunta (segundos)

    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
// src/assessments/entities/assessment-question-translation.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { AssessmentQuestion } from './assessment-question.entity';

@Entity('assessment_question_translations')
export class AssessmentQuestionTranslation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssessmentQuestion, question => question.translations, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'questionId' })
    question: AssessmentQuestion;

    @Column()
    questionId: string;

    @Column({ length: 10 })
    languageCode: string;

    @Column({ type: 'text' })
    questionText: string; // Texto de la pregunta

    @Column({ type: 'text', nullable: true })
    hint: string; // Pista o ayuda

    @Column({ type: 'text', nullable: true })
    feedback: string; // Retroalimentación general

    @Column({ type: 'text', nullable: true })
    correctFeedback: string; // Feedback para respuesta correcta

    @Column({ type: 'text', nullable: true })
    incorrectFeedback: string; // Feedback para respuesta incorrecta

    @Column({ type: 'text', nullable: true })
    explanation: string; // Explicación de la respuesta

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
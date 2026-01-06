// src/assessments/entities/assessment-question-option.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { AssessmentQuestion } from './assessment-question.entity';
import { AssessmentQuestionOptionTranslation } from './assessment-question-option-translation.entity';

@Entity('assessment_question_options')
export class AssessmentQuestionOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssessmentQuestion, question => question.options, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'questionId' })
    question: AssessmentQuestion;

    @Column()
    questionId: string;

    @Column({ default: 0 })
    order: number; // Orden de la opción

    @Column({ default: false })
    isCorrect: boolean; // Si es la respuesta correcta

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    partialCreditPercentage: number; // Porcentaje de crédito parcial

    // Para preguntas de emparejamiento
    @Column({ nullable: true })
    matchingPairId: string; // ID del par correspondiente

    @Column({ nullable: true })
    matchingGroup: string; // Grupo de emparejamiento

    // Metadatos
    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => AssessmentQuestionOptionTranslation, translation => translation.option, {
        cascade: true,
        eager: true
    })
    translations: AssessmentQuestionOptionTranslation[];

    // Métodos helper
    getTranslation(languageCode: string): AssessmentQuestionOptionTranslation | undefined {
        return this.translations?.find(t => t.languageCode === languageCode);
    }
}
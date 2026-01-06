// src/assessments/entities/assessment-question-option-translation.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { AssessmentQuestionOption } from './assessment-question-option.entity';

@Entity('assessment_question_option_translations')
export class AssessmentQuestionOptionTranslation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AssessmentQuestionOption, option => option.translations, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'optionId' })
    option: AssessmentQuestionOption;

    @Column()
    optionId: string;

    @Column({ length: 10 })
    languageCode: string;

    @Column({ type: 'text' })
    optionText: string; // Texto de la opción

    @Column({ type: 'text', nullable: true })
    feedback: string; // Retroalimentación específica para esta opción

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
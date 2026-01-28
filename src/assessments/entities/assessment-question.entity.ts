// src/assessments/entities/assessment-question.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, OneToMany,
    DeleteDateColumn
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { AssessmentQuestionOption } from './assessment-question-option.entity';
import { AssessmentQuestionTranslation } from './assessment-question-translation.entity';

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',     // Opción múltiple (una respuesta)
    MULTIPLE_RESPONSE = 'multiple_response', // Opción múltiple (varias respuestas)
    TRUE_FALSE = 'true_false',               // Verdadero/Falso
    SHORT_ANSWER = 'short_answer',           // Respuesta corta
    ESSAY = 'essay',                         // Ensayo/respuesta larga
    MATCHING = 'matching',                   // Emparejar
    ORDERING = 'ordering',                   // Ordenar
    FILL_IN_BLANK = 'fill_in_blank',        // Completar espacios
    SCALE = 'scale',                         // Escala (1-5, 1-10, etc.)
    MATRIX = 'matrix'                        // Matriz de opciones
}

export enum QuestionDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

@Entity('assessment_questions')
export class AssessmentQuestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Assessment, assessment => assessment.questions, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'assessmentId' })
    assessment: Assessment;

    @Column()
    assessmentId: string;

    @Column({
        type: 'enum',
        enum: QuestionType,
        default: QuestionType.MULTIPLE_CHOICE
    })
    type: QuestionType;

    @Column({ default: 0 })
    order: number; // Orden de la pregunta

    @Column({ default: true })
    isGradable: boolean; // Si cuenta para la calificación (false = pregunta adicional)

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
    points: number; // Puntos que vale la pregunta

    @Column({
        type: 'enum',
        enum: QuestionDifficulty,
        nullable: true
    })
    difficulty: QuestionDifficulty;

    @Column({ default: false })
    isRequired: boolean; // Si es obligatoria

    @Column({ default: false })
    allowPartialCredit: boolean; // Permitir crédito parcial

    // Configuración específica por tipo de pregunta
    @Column({ default: false })
    caseSensitive: boolean; // Para respuestas de texto

    @Column({ nullable: true })
    minLength: number; // Longitud mínima de respuesta

    @Column({ nullable: true })
    maxLength: number; // Longitud máxima de respuesta

    @Column({ nullable: true })
    scaleMin: number; // Para preguntas tipo escala

    @Column({ nullable: true })
    scaleMax: number; // Para preguntas tipo escala

    @Column({ nullable: true })
    scaleStep: number; // Paso para escalas

    // Agrupación y categorización
    @Column({ nullable: true })
    category: string; // Categoría de la pregunta

    @Column({ nullable: true })
    tag: string; // Etiquetas para búsqueda

    @Column({ nullable: true })
    questionBankId: string; // ID del banco de preguntas (si aplica)

    // Configuración de randomización
    @Column({ nullable: true })
    randomGroup: string; // Grupo de aleatorización

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

    @DeleteDateColumn()
    deletedAt: Date;

    @OneToMany(() => AssessmentQuestionOption, option => option.question, {
        cascade: true
    })
    options: AssessmentQuestionOption[];

    @OneToMany(() => AssessmentQuestionTranslation, translation => translation.question, {
        cascade: true,
        eager: true
    })
    translations: AssessmentQuestionTranslation[];

    // Métodos helper
    getTranslation(languageCode: string): AssessmentQuestionTranslation | undefined {
        return this.translations?.find(t => t.languageCode === languageCode);
    }

    getCorrectOptions(): AssessmentQuestionOption[] {
        return this.options?.filter(o => o.isCorrect) || [];
    }

    hasMultipleCorrectAnswers(): boolean {
        return this.getCorrectOptions().length > 1;
    }
}
// src/assessments/entities/assessment-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { Assessment } from './assessment.entity';

export enum GradingMethod {
    AUTOMATIC = 'automatic',     // Calificación automática
    MANUAL = 'manual',           // Calificación manual
    HYBRID = 'hybrid'            // Combinación de automática y manual
}

export enum QuestionOrderMode {
    FIXED = 'fixed',             // Orden fijo
    RANDOM = 'random',           // Orden aleatorio
    RANDOM_GROUPS = 'random_groups' // Aleatorio por grupos
}

@Entity('assessment_configurations')
export class AssessmentConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Assessment, assessment => assessment.configuration)
    @JoinColumn({ name: 'assessmentId' })
    assessment: Assessment;

    @Column()
    assessmentId: string;

    // Configuración de calificación
    @Column({ default: true })
    isGradable: boolean; // Si otorga calificación

    @Column({
        type: 'enum',
        enum: GradingMethod,
        default: GradingMethod.AUTOMATIC
    })
    gradingMethod: GradingMethod;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    passingScore: number; // Nota mínima para aprobar (ej: 70.00)

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
    maxScore: number; // Puntaje máximo posible

    // Configuración de certificados
    @Column({ default: false })
    generatesCertificate: boolean; // Si genera certificado al aprobar

    @Column({ nullable: true })
    certificateTemplateId: string; // ID de la plantilla de certificado

    @Column({ default: false })
    requirePassingScoreForCertificate: boolean; // Requiere nota mínima para certificado

    // Configuración de preguntas adicionales
    @Column({ default: false })
    hasAdditionalQuestions: boolean; // Si tiene preguntas no calificables

    @Column({ nullable: true })
    additionalQuestionsPosition: string; // 'start', 'end', 'mixed'

    @Column({ nullable: true, type: 'text' })
    additionalQuestionsInstructions: string; // Instrucciones para preguntas adicionales

    // Configuración de intentos
    @Column({ default: 1 })
    maxAttempts: number; // Número máximo de intentos (0 = ilimitado)

    @Column({ default: false })
    allowReview: boolean; // Permitir revisar respuestas después de enviar

    @Column({ default: false })
    showCorrectAnswers: boolean; // Mostrar respuestas correctas después de enviar

    @Column({ default: false })
    showScoreImmediately: boolean; // Mostrar calificación inmediatamente

    @Column({ nullable: true })
    timeBetweenAttempts: number; // Tiempo en minutos entre intentos

    // Configuración de tiempo
    @Column({ nullable: true })
    timeLimit: number; // Límite de tiempo en minutos (null = sin límite)

    @Column({ default: false })
    strictTimeLimit: boolean; // Si el tiempo es estricto (auto-enviar al terminar)

    // Configuración de preguntas
    @Column({
        type: 'enum',
        enum: QuestionOrderMode,
        default: QuestionOrderMode.FIXED
    })
    questionOrderMode: QuestionOrderMode;

    @Column({ default: false })
    randomizeOptions: boolean; // Aleatorizar orden de opciones

    @Column({ default: false })
    oneQuestionPerPage: boolean; // Una pregunta por página

    @Column({ default: true })
    allowNavigationBetweenQuestions: boolean; // Permitir navegar entre preguntas

    // Fechas de disponibilidad
    @Column({ nullable: true })
    availableFrom: Date; // Fecha desde la que está disponible

    @Column({ nullable: true })
    availableUntil: Date; // Fecha hasta la que está disponible

    @Column({ nullable: true })
    gradeReleaseDate: Date; // Fecha de liberación de calificaciones

    // Configuración de acceso
    @Column({ default: false })
    requirePassword: boolean; // Requiere contraseña para acceder

    @Column({ nullable: true })
    accessPassword: string; // Contraseña de acceso

    @Column({ default: false })
    requireProctoring: boolean; // Requiere supervisión

    @Column({ default: false })
    preventTabSwitching: boolean; // Prevenir cambio de pestañas

    @Column({ default: false })
    fullscreenMode: boolean; // Modo pantalla completa

    // Configuración de feedback
    @Column({ default: true })
    showFeedbackAfterQuestion: boolean; // Mostrar feedback después de cada pregunta

    @Column({ default: true })
    showFeedbackAfterCompletion: boolean; // Mostrar feedback al completar

    @Column({ nullable: true, type: 'text' })
    customPassMessage: string; // Mensaje personalizado al aprobar

    @Column({ nullable: true, type: 'text' })
    customFailMessage: string; // Mensaje personalizado al reprobar

    // Configuración de notificaciones
    @Column({ default: false })
    notifyInstructorOnCompletion: boolean; // Notificar instructor al completar

    @Column({ default: false })
    notifyInstructorOnNewAttempt: boolean; // Notificar instructor en nuevo intento

    // Metadatos adicionales
    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Métodos helper
    isAvailable(): boolean {
        const now = new Date();
        if (this.availableFrom && now < this.availableFrom) return false;
        if (this.availableUntil && now > this.availableUntil) return false;
        return true;
    }

    canAttempt(attemptCount: number): boolean {
        if (this.maxAttempts === 0) return true; // Ilimitado
        return attemptCount < this.maxAttempts;
    }

    hasTimeLimit(): boolean {
        return this.timeLimit !== null && this.timeLimit > 0;
    }
}
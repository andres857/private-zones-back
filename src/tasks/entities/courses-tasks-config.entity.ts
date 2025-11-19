// src/courses/entities/courses-tasks-config.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Task } from './courses-tasks.entity';

@Entity('tasks_config')
export class TaskConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Task, task => task.configuration)
    @JoinColumn({ name: 'taskId' })
    task: Task;

    @Column()
    taskId: string;

    @Column({ default: true })
    isActive: boolean;

    // Recursos y materiales de apoyo
    @Column({ default: false })
    enableSupportResources: boolean; // Habilitar recursos de apoyo

    @Column({ default: false })
    showResourcesBeforeSubmission: boolean; // Mostrar recursos antes de enviar

    // Autoevaluación y revisión
    @Column({ default: false })
    enableSelfAssessment: boolean; // Habilitar autocalificación

    @Column({ default: false })
    requireSelfAssessmentBeforeSubmit: boolean; // Requerir autoevaluación antes de enviar

    // Configuración de archivos
    @Column({ default: true })
    enableFileUpload: boolean; // Habilitar subida de archivos

    @Column({ default: false })
    requireFileUpload: boolean; // Hacer obligatorio subir al menos un archivo

    @Column({ default: false })
    enableTextSubmission: boolean; // Permitir envío de texto además de archivos

    @Column({ default: false })
    requireTextSubmission: boolean; // Hacer obligatorio el texto de envío

    // Visibilidad y notificaciones
    @Column({ default: true })
    showToStudentsBeforeStart: boolean; // Mostrar a estudiantes antes de startDate

    @Column({ default: true })
    sendReminderBeforeDue: boolean; // Enviar recordatorio antes de fecha límite

    @Column({ type: 'int', nullable: true, default: 24 })
    reminderHoursBeforeDue: number; // Horas antes para enviar recordatorio

    @Column({ default: true })
    notifyOnGrade: boolean; // Notificar al estudiante cuando se califica

    // Configuración de calificación
    @Column({ default: false })
    autoGrade: boolean; // Calificación automática (para rúbricas futuras)

    @Column({ default: false })
    requireGradeComment: boolean; // Requerir comentario al calificar

    @Column({ default: false })
    enableGradeRubric: boolean; // Habilitar rúbrica de calificación

    @Column({ type: 'jsonb', nullable: true })
    rubricData: Record<string, any>; // Datos de la rúbrica (para futuro)

    // Configuración de visualización de envíos
    @Column({ default: false })
    showOtherSubmissions: boolean; // Mostrar otros envíos (después de enviar)

    @Column({ default: false })
    anonymizeSubmissions: boolean; // Anonimizar envíos en la vista

    // Configuración avanzada
    @Column({ default: false })
    enableGroupSubmission: boolean; // Permitir envíos grupales

    @Column({ type: 'int', nullable: true })
    maxGroupSize: number; // Tamaño máximo del grupo

    @Column({ default: false })
    enableVersionControl: boolean; // Mantener historial de versiones

    @Column({ default: false })
    lockAfterGrade: boolean; // Bloquear edición después de calificar

    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>; // Metadatos adicionales

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
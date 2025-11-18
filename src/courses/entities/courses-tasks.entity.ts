// src/courses/entities/courses-tasks.entity.ts
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index, OneToOne, OneToMany } from 'typeorm';
import { TaskConfig } from './courses-tasks-config.entity';
import { Courses } from './courses.entity';
import { TaskSubmission } from './courses-tasks-submissions.entity';
import { TaskAttachment } from './courses-tasks-attachments.entity';

export enum TaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, tenant => tenant.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    @Index()
    tenantId: string;

    @ManyToOne(() => Courses, course => course.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'courseId' })
    course: Courses;

    @Column()
    @Index()
    courseId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    creator: User;

    @Column({ nullable: true })
    createdBy: string; // ID del profesor/admin que creó la tarea

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string; // Descripción general

    @Column({ type: 'text', nullable: true })
    instructions: string; // Instrucciones detalladas para completar la tarea

    @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.DRAFT })
    status: TaskStatus;

    // Fechas
    @Column({ type: 'timestamp', nullable: true })
    startDate: Date; // Fecha desde cuando está disponible

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date; // Fecha límite de entrega (dueDate)

    @Column({ type: 'timestamp', nullable: true })
    lateSubmissionDate: Date; // Fecha límite para entregas tardías

    // Calificación
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    maxPoints: number; // Puntos máximos de la tarea

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
    lateSubmissionPenalty: number; // Penalización por entrega tardía (porcentaje)

    // Configuración de archivos
    @Column({ type: 'int', default: 5 })
    maxFileUploads: number; // Límite de archivos que puede subir el estudiante

    @Column({ type: 'int', default: 10 }) // En MB
    maxFileSize: number; // Tamaño máximo por archivo en MB

    @Column({ type: 'simple-array', nullable: true })
    allowedFileTypes: string[]; // ['pdf', 'doc', 'docx', 'jpg', 'png']

    // Configuración de envíos
    @Column({ default: true })
    allowMultipleSubmissions: boolean; // Permitir múltiples intentos

    @Column({ type: 'int', nullable: true })
    maxSubmissionAttempts: number | null; // Número máximo de intentos (null = ilimitado)

    @Column({ default: true })
    requireSubmission: boolean; // Si es obligatoria o no

    @Column({ default: false })
    enablePeerReview: boolean; // Habilitar revisión entre pares

    // Visualización
    @Column({ nullable: true })
    thumbnailImagePath: string;

    @Column({ type: 'int', nullable: true, default: 0 })
    order: number; // Orden dentro del curso

    @Column({ default: true })
    showGradeToStudent: boolean; // Mostrar calificación al estudiante

    @Column({ default: true })
    showFeedbackToStudent: boolean; // Mostrar retroalimentación al estudiante

    @Column({ default: false })
    notifyOnSubmission: boolean; // Notificar al profesor cuando hay envío

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

    @DeleteDateColumn()
    deletedAt: Date;

    // Relaciones
    @OneToOne(() => TaskConfig, config => config.task, { cascade: true })
    configuration: TaskConfig;

    @OneToMany(() => TaskSubmission, submission => submission.task, { cascade: true })
    submissions: TaskSubmission[];

    @OneToMany(() => TaskAttachment, attachment => attachment.task, { cascade: true })
    attachments: TaskAttachment[]; // Archivos de recursos de la tarea

    // Métodos helper
    isOpen(): boolean {
        const now = new Date();
        if (this.status !== TaskStatus.PUBLISHED) return false;
        if (this.startDate && now < this.startDate) return false;
        if (this.endDate && now > this.endDate && !this.lateSubmissionDate) return false;
        return true;
    }

    acceptsLateSubmissions(): boolean {
        const now = new Date();
        return !!(this.lateSubmissionDate && now <= this.lateSubmissionDate);
    }

    isOverdue(): boolean {
        const now = new Date();
        return now > this.endDate;
    }

    canSubmit(attemptNumber: number): boolean {
        if (!this.allowMultipleSubmissions && attemptNumber > 1) return false;
        if (this.maxSubmissionAttempts && attemptNumber > this.maxSubmissionAttempts) return false;
        return true;
    }
}
// src/courses/entities/courses-tasks-submissions.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Task } from './courses-tasks.entity';
import { User } from 'src/users/entities/user.entity';
import { TaskSubmissionFile } from './courses-tasks-submission-files.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  LATE = 'late',
  GRADED = 'graded',
  RETURNED = 'returned', // Devuelto para correcciones
  RESUBMITTED = 'resubmitted'
}

@Entity('task_submissions')
export class TaskSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Task, task => task.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  @Index()
  taskId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.DRAFT })
  status: SubmissionStatus;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number; // Número de intento

  @Column({ type: 'text', nullable: true })
  textSubmission: string; // Texto de envío (si está habilitado)

  @Column({ type: 'text', nullable: true })
  comments: string; // Comentarios del estudiante

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date; // Fecha de envío

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  grade: number; // Calificación obtenida

  @Column({ type: 'text', nullable: true })
  feedback: string; // Retroalimentación del profesor

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'gradedBy' })
  grader: User;

  @Column({ nullable: true })
  gradedBy: string; // ID del profesor que calificó

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date; // Fecha de calificación

  @Column({ default: false })
  isLate: boolean; // Si fue entregado tarde

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  penaltyApplied: number; // Penalización aplicada

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

  // Relación con archivos subidos
  @OneToMany(() => TaskSubmissionFile, file => file.submission, { cascade: true })
  files: TaskSubmissionFile[];

  // Métodos helper
  getFinalGrade(): number | null {
    if (!this.grade) return null;
    if (!this.isLate || !this.penaltyApplied) return this.grade;
    return Math.max(0, this.grade - this.penaltyApplied);
  }

  isGraded(): boolean {
    return this.status === SubmissionStatus.GRADED && this.grade !== null;
  }
}
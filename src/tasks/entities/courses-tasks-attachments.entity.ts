// src/courses/entities/courses-tasks-attachments.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from './courses-tasks.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';

@Entity('task_attachments')
export class TaskAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Task, task => task.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  @Index()
  taskId: string;

  @Column()
  fileName: string;

  @Column()
  originalFileName: string;

  @Column({ type: 'text' })
  fileUrl: string; // URL del archivo (S3, storage local, etc.)

  @Column({ type: 'bigint' })
  fileSize: number; // Tamaño en bytes

  @Column()
  fileType: string; // MIME type (application/pdf, image/png, etc.)

  @Column({ nullable: true })
  fileExtension: string; // pdf, docx, jpg, etc.

  @Column({ type: 'text', nullable: true })
  description: string; // Descripción del recurso

  @Column({ type: 'int', default: 0 })
  order: number; // Orden de visualización

  @Column({
    type: 'jsonb',
    default: {}
  })
  metadata: Record<string, any>;

  @CreateDateColumn()
  uploadedAt: Date;
}
// src/courses/entities/courses-tasks-submission-files.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TaskSubmission } from './courses-tasks-submissions.entity';

@Entity('task_submission_files')
export class TaskSubmissionFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TaskSubmission, submission => submission.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: TaskSubmission;

  @Column()
  @Index()
  submissionId: string;

  @Column()
  fileName: string;

  @Column()
  originalFileName: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'bigint' })
  fileSize: number; // Tamaño en bytes

  @Column()
  fileType: string; // MIME type

  @Column({ nullable: true })
  fileExtension: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({
    type: 'jsonb',
    default: {}
  })
  metadata: Record<string, any>;

  @CreateDateColumn()
  uploadedAt: Date;
}
// src/courses/entities/courses-translations.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
  OneToOne
} from 'typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Courses } from './courses.entity';

@Entity('courses_translations')
export class CourseTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el curso
  @ManyToOne(() => Courses, course => course.translations)
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  @Column()
  courseId: string;

  // Código de idioma ISO 639-1
  @Column({ length: 5 })
  languageCode: string; // ej: 'es', 'en', 'fr', 'pt-BR'

  // Campos traducibles
  @Column()
  title: string; // Título del curso traducido

  @Column({ type: 'text', nullable: true })
  description: string | null; // Descripción traducida

  // Metadatos traducibles
  @Column({
    type: 'jsonb',
    default: {}
  })
  metadata: {
    tags?: string[]; // Tags traducidos
    keywords?: string[]; // Palabras clave traducidas
    customFields?: Record<string, string>; // Campos personalizados traducidos
  };

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
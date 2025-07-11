// src/courses/entities/courses-config.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
  OneToOne
} from 'typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Courses } from './courses.entity';

export enum CourseVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted'
}

export enum CourseIntensity {
  LOW = 'low',        // 1-5 horas
  MEDIUM = 'medium',  // 6-15 horas
  HIGH = 'high',      // 16-40 horas
  INTENSIVE = 'intensive' // 40+ horas
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended'
}

@Entity('course_configurations')
export class CourseConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación uno a uno con el curso
  @OneToOne(() => Courses, course => course.configuration)
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  @Column()
  courseId: string;

  // Configuración de visibilidad
  @Column({
    type: 'enum',
    enum: CourseVisibility,
    default: CourseVisibility.PRIVATE
  })
  visibility: CourseVisibility;

  @Column({ default: true })
  isActive: boolean;

  // Indica si el curso está visible en listados públicos
  @Column({ default: false })
  isPublicGroup: boolean;

  // Status del curso
  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT
  })
  status: CourseStatus;

  // Imágenes del curso
  @Column({ nullable: true })
  coverImage: string; // URL de la imagen de portada

  @Column({ nullable: true })
  menuImage: string; // URL de la imagen del menú

  @Column({ nullable: true })
  thumbnailImage: string; // URL de la imagen thumbnail

  @Column()
  colorTitle: string; // Configuracion de color de titulo del curso

  // Información académica
  @Column({ nullable: true, length: 10 })
  acronym: string; // Siglas del curso ej: "CARD-101"

  @Column({ nullable: true })
  code: string; // Código interno del curso

  @Column({ nullable: true })
  category: string; // Categoría del curso

  @Column({ nullable: true })
  subcategory: string; // Subcategoría del curso

  // Intensidad y duración
  // @Column({
  //   type: 'enum',
  //   enum: CourseIntensity,
  //   default: CourseIntensity.MEDIUM
  // })
  // intensity: CourseIntensity;

  @Column({
    default: 0
  })
  intensity: number;

  @Column({ nullable: true })
  estimatedHours: number; // Horas estimadas de duración

  // Configuracion de enlace de invitacion
  @Column({nullable: true})
  invitation_link: string;

  // @Column({ nullable: true })
  // credits: number; // Créditos académicos

  // Fechas importantes
  @Column({ nullable: true })
  startDate: Date; // Fecha de inicio

  @Column({ nullable: true })
  endDate: Date; // Fecha de fin

  @Column({ nullable: true })
  enrollmentStartDate: Date; // Inicio de inscripciones

  @Column({ nullable: true })
  enrollmentEndDate: Date; // Fin de inscripciones

  // Configuración de inscripciones
  @Column({ nullable: true })
  maxEnrollments: number; // Máximo de inscripciones

  @Column({ default: false })
  requiresApproval: boolean; // Requiere aprobación para inscribirse

  @Column({ default: false })
  allowSelfEnrollment: boolean; // Permite auto-inscripción

  // Prerrequisitos
  @Column({
    type: 'jsonb',
    default: []
  })
  prerequisites: string[]; // IDs de cursos prerequisito

  // Configuración de evaluación
  @Column({ nullable: true })
  passingGrade: number; // Nota mínima para aprobar

  // Configuración de certificación
  @Column({ default: false })
  generatesCertificate: boolean; // Genera certificado

  @Column({ nullable: true })
  certificateTemplate: string; // Plantilla del certificado

  // Metadatos adicionales
  @Column({
    type: 'jsonb',
    default: {}
  })
  metadata: Record<string, any>; // Metadatos adicionales

  // Orden de listado
  @Column()
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos helper
  isPublic(): boolean {
    return this.visibility === CourseVisibility.PUBLIC;
  }

  isEnrollmentOpen(): boolean {
    const now = new Date();
    if (this.enrollmentStartDate && now < this.enrollmentStartDate) return false;
    if (this.enrollmentEndDate && now > this.enrollmentEndDate) return false;
    return true;
  }

  canEnroll(): boolean {
    return this.isEnrollmentOpen() && 
           this.status === CourseStatus.PUBLISHED &&
           this.allowSelfEnrollment;
  }

  hasPrerequisites(): boolean {
    return this.prerequisites && this.prerequisites.length > 0;
  }
}


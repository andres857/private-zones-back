// src/courses/entities/courses.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
  OneToOne,
  DeleteDateColumn
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { CourseConfiguration } from './courses-config.entity';
import { CourseTranslation } from './courses-translations.entity';
import { CoursesViewsConfig } from './courses-view-config.entity'
import { Section } from 'src/sections/entities/sections.entity';

@Entity('courses')
export class Courses {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string; // ej: "curso-induccion-la-cardio"

  @ManyToOne(() => Tenant, tenant => tenant.courses)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  // ManyToMany
  @ManyToMany(() => Section, section => section.courses)
  @JoinTable({
    name: 'courses_sections', // nombre de la tabla intermedia
    joinColumn: {
      name: 'courseId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'sectionId',
      referencedColumnName: 'id'
    }
  })
  sections: Section[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @OneToOne(() => CourseConfiguration, config => config.course, { 
    cascade: true, 
    eager: false 
  })
  configuration: CourseConfiguration;

  @OneToMany(() => CourseTranslation, translation => translation.course, { 
    cascade: true, 
    eager: false 
  })
  translations: CourseTranslation[];

  @OneToMany(() => CoursesViewsConfig, viewConfig => viewConfig.course, { cascade: true })
  viewsConfig: CoursesViewsConfig[];

  // Método helper para obtener traducción por idioma
  getTranslation(languageCode: string): CourseTranslation | undefined {
    return this.translations?.find(t => t.languageCode === languageCode);
  }

  getTranslatedTitle(languageCode: string = 'es'): string {
    const translation = this.getTranslation(languageCode);
    return translation?.title || this.slug;
  }

  // Método helper para verificar si pertenece a una sección
  belongsToSection(sectionId: string): boolean {
    return this.sections?.some(section => section.id === sectionId) || false;
  }
}
// src/courses/entities/courses.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
  OneToOne
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

  @ManyToOne(() => Section, section => section.courses)
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relación uno a uno con la configuración del curso
  @OneToOne(() => CourseConfiguration, config => config.course, { 
    cascade: true, 
    eager: false 
  })
  configuration: CourseConfiguration;

  // Relación uno a muchos con las traducciones
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

  // Método helper para obtener el título traducido
  getTranslatedTitle(languageCode: string = 'es'): string {
    const translation = this.getTranslation(languageCode);
    return translation?.title || this.slug;
  }
}

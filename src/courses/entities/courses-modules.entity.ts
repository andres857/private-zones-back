// src/courses/entities/courses-modules.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
  OneToOne,
  DeleteDateColumn
} from 'typeorm';

import { Courses } from './courses.entity';
import { ModuleItem } from './courses-modules-item.entity';
import { CourseModuleConfig } from './courses-modules-config.entity';

@Entity('courses_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Courses, course => course.modules)
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  @Column()
  courseId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true})
  thumbnailImagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => CourseModuleConfig, config => config.courseModule)
  configuration: CourseModuleConfig;

  @OneToMany(() => ModuleItem, item => item.module)
  items: ModuleItem[];
}

import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
  OneToOne,
  DeleteDateColumn
} from 'typeorm';

import { CourseModule } from './courses-modules.entity';

export enum ModuleItemType {
  CONTENT = 'content',
  FORUM = 'forum',
  TASK = 'task',
  QUIZ = 'quiz',
  SURVEY = 'survey',
  ACTIVITY = 'activity',
}

@Entity('courses_modules_items')
export class ModuleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseModule, module => module.items)
  @JoinColumn({ name: 'moduleId' })
  module: CourseModule;

  @Column()
  moduleId: string;

  @Column({ type: 'enum', enum: ModuleItemType })
  type: ModuleItemType;

  @Column()
  referenceId: string; // ID al objeto real (contenido, foro, etc.)

  @Column({ default: 0 })
  order: number;
}

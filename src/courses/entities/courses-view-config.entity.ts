// src/courses/entities/courses-views-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
    OneToOne
} from 'typeorm';

import { Courses } from './courses.entity';

@Entity('courses-views-config')
export class CoursesViewsConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;



    @ManyToOne(() => Courses, course => course.viewsConfig)
    @JoinColumn({ name: 'courseId' })
    course: Courses;

    @Column()
    courseId: string;



    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}

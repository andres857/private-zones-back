// src/courses/entities/courses.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
    OneToOne,
    DeleteDateColumn
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

import { Courses } from './courses.entity';
import { CourseModule } from './courses-modules.entity';

@Entity('courses_modules_config')
export class CourseModuleConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => CourseModule, courseModule => courseModule.configuration)
    @JoinColumn({ name: 'courseModuleId' })
    courseModule: CourseModule;

    @Column()
    courseModuleId: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 0 })
    order: number;

    @Column({ default: 80 })
    approvalPercentage: number;

    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>; // Metadatos adicionales

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

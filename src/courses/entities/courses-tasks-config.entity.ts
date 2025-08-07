// src/courses/entities/courses.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
    OneToOne,
    DeleteDateColumn
} from 'typeorm';

import { Task } from './courses-tasks.entity';

@Entity('tasks_config')
export class TaskConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Task, taskConfig => taskConfig.configuration)
    @JoinColumn({ name: 'taskId' })
    taskConfig: Task;

    @Column()
    taskId: string;

    @Column({ default: true })
    isActive: boolean;

    // Habilitar recursos de apoyo
    @Column({ default: false })
    enableSupportResources: boolean;

    // HAbilitar autocalificación
    @Column({ default: false })
    enableSelfAssessment: boolean;

    // Habilitar subida de archivos
    @Column({ default: false })
    enableFileUpload: boolean;

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

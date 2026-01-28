// src/activities/entities/activity.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany
} from 'typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { ActivityConfiguration } from './activity-config.entity';
import { ActivityTranslation } from './activity-translation.entity';
import { ActivityAttempt } from './activity-attempt.entity';

export enum ActivityType {
    HANGING = 'hanging',                // Ahorcado
    COMPLETE_PHRASE = 'complete_phrase',  // Completar frase
    DRAG_DROP = 'drag_drop',           // Arrastrar y soltar
    CROSSWORD = 'crossword',            // Crucigrama
    MATCHING = 'matching',              // Emparejar
    WORD_SEARCH = 'word_search',        // Sopa de letras
    MEMORY = 'memory',                  // Memoria
    QUIZ_GAME = 'quiz_game',           // Quiz interactivo
    PUZZLE = 'puzzle'                   // Rompecabezas
}

export enum ActivityStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
    SUSPENDED = 'suspended'
}

export enum ActivityDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXPERT = 'expert'
}

@Entity('activities')
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slug: string;

    @ManyToOne(() => Tenant, tenant => tenant.activities)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    tenantId: string;

    @ManyToOne(() => Courses, course => course.activities, { nullable: true })
    @JoinColumn({ name: 'courseId' })
    course: Courses;

    @Column({ nullable: true })
    courseId: string;

    @Column({
        type: 'enum',
        enum: ActivityType,
        default: ActivityType.WORD_SEARCH
    })
    type: ActivityType;

    @Column({
        type: 'enum',
        enum: ActivityStatus,
        default: ActivityStatus.DRAFT
    })
    status: ActivityStatus;

    @Column({
        type: 'enum',
        enum: ActivityDifficulty,
        default: ActivityDifficulty.MEDIUM
    })
    difficulty: ActivityDifficulty;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 0 })
    order: number;

    @Column({ default: 0 })
    maxScore: number; // Puntaje máximo posible

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @OneToOne(() => ActivityConfiguration, config => config.activity, {
        cascade: true,
        eager: false
    })
    configuration: ActivityConfiguration;

    @OneToMany(() => ActivityTranslation, translation => translation.activity, {
        cascade: true,
        eager: true
    })
    translations: ActivityTranslation[];

    @OneToMany(() => ActivityAttempt, attempt => attempt.activity)
    attempts: ActivityAttempt[];

    // Métodos helper
    getTranslation(languageCode: string): ActivityTranslation | undefined {
        return this.translations?.find(t => t.languageCode === languageCode);
    }

    getTranslatedTitle(languageCode: string = 'es'): string {
        const translation = this.getTranslation(languageCode);
        return translation?.title || this.slug;
    }
}
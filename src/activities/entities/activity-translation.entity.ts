// src/activities/entities/activity-translation.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_translations')
@Unique(['activityId', 'languageCode'])
export class ActivityTranslation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Activity, activity => activity.translations, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'activityId' })
    activity: Activity;

    @Column()
    activityId: string;

    @Column({ length: 10 })
    languageCode: string; // ej: 'es', 'en', 'fr'

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    instructions: string; // Instrucciones del juego

    @Column({ type: 'text', nullable: true })
    welcomeMessage: string;

    @Column({ type: 'text', nullable: true })
    completionMessage: string;

    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
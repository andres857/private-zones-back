// src/activities/entities/activity-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_configurations')
export class ActivityConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Activity, activity => activity.configuration)
    @JoinColumn({ name: 'activityId' })
    activity: Activity;

    @Column()
    activityId: string;

    // Configuración de tiempo
    @Column({ nullable: true })
    timeLimit: number; // Tiempo límite en minutos

    @Column({ default: false })
    strictTimeLimit: boolean; // Si es estricto, se cierra automáticamente

    // Configuración de intentos
    @Column({ default: 0 })
    maxAttempts: number; // 0 = ilimitado

    @Column({ nullable: true })
    timeBetweenAttempts: number; // Tiempo en minutos entre intentos

    // Configuración de visualización
    @Column({ default: true })
    showTimer: boolean; // Mostrar temporizador

    @Column({ default: true })
    showScore: boolean; // Mostrar puntaje

    @Column({ default: false })
    showHints: boolean; // Permitir pistas

    @Column({ default: 3 })
    maxHints: number; // Número máximo de pistas

    // Configuración de puntuación
    @Column({ default: true })
    isGradable: boolean; // Si otorga puntos

    @Column({ nullable: true })
    passingScore: number; // Puntaje mínimo para aprobar

    @Column({ default: true })
    showScoreImmediately: boolean;

    // Configuración de disponibilidad
    @Column({ type: 'timestamp', nullable: true })
    availableFrom: Date;

    @Column({ type: 'timestamp', nullable: true })
    availableUntil: Date;

    // Configuración de feedback
    @Column({ default: true })
    showFeedbackAfterCompletion: boolean;

    @Column({ nullable: true, type: 'text' })
    customSuccessMessage: string;

    @Column({ nullable: true, type: 'text' })
    customFailMessage: string;

    // Configuración de gamificación
    @Column({ default: false })
    awardBadges: boolean;

    @Column({ default: false })
    showLeaderboard: boolean;

    // Configuración de notificaciones
    @Column({ default: false })
    notifyInstructorOnCompletion: boolean;

    // Datos específicos del tipo de actividad (JSON)
    @Column({
        type: 'jsonb',
        default: {}
    })
    gameData: Record<string, any> | null;

    // Metadatos adicionales
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
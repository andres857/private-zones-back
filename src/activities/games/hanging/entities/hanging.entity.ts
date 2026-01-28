// src/activities/games/hanging/entities/hanging.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { Activity } from '../../../entities/activity.entity';

export interface HangingWord {
    word: string;
    category?: string;
    clue?: string;
}

@Entity('hanging_games')
export class HangingGame {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Activity)
    @JoinColumn({ name: 'activityId' })
    activity: Activity;

    @Column()
    activityId: string;

    /**
     * Lista de palabras/frases para el juego
     */
    @Column({
        type: 'jsonb',
        default: []
    })
    words: HangingWord[];

    @Column({ default: 6 })
    maxAttempts: number; // Intentos máximos (errores permitidos)

    @Column({ default: false })
    caseSensitive: boolean;

    @Column({ default: true })
    showCategory: boolean;

    @Column({ default: false })
    showWordLength: boolean; // Mostrar cantidad de letras

    @Column({ default: 10 })
    pointsPerWord: number;

    @Column({ default: 5 })
    bonusForNoErrors: number; // Bonus si no comete errores

    @Column({ default: -2 })
    penaltyPerError: number;

    @Column({ default: -3 })
    penaltyPerHint: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
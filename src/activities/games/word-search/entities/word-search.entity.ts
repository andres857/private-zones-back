// src/activities/games/word-search/entities/word-search.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn, BeforeInsert
} from 'typeorm';
import { Activity } from '../../../entities/activity.entity';
import * as crypto from 'crypto';

export enum WordDirection {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
    DIAGONAL_DOWN = 'diagonal_down',
    DIAGONAL_UP = 'diagonal_up',
    HORIZONTAL_REVERSE = 'horizontal_reverse',
    VERTICAL_REVERSE = 'vertical_reverse',
    DIAGONAL_DOWN_REVERSE = 'diagonal_down_reverse',
    DIAGONAL_UP_REVERSE = 'diagonal_up_reverse'
}

export interface WordItem {
    word: string;
    clue?: string;
    category?: string;
}

@Entity('word_search_games')
export class WordSearchGame {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Activity)
    @JoinColumn({ name: 'activityId' })
    activity: Activity;

    @Column()
    activityId: string;

    @Column({ default: 15 })
    gridWidth: number;

    @Column({ default: 15 })
    gridHeight: number;

    /**
     * El SEED es la clave para la escalabilidad.
     * Con este string y la lista de palabras, el generador siempre creará el mismo tablero.
     */
    @Column({ type: 'varchar', length: 255 })
    seed: string;

    /**
     * Solo guardamos las palabras base. 
     * El generador usará el 'seed' para decidir dónde colocarlas.
     */
    @Column({
        type: 'jsonb',
        default: []
    })
    words: WordItem[];

    @Column({
        type: 'jsonb',
        default: [
            WordDirection.HORIZONTAL,
            WordDirection.VERTICAL,
            WordDirection.DIAGONAL_DOWN
        ]
    })
    allowedDirections: WordDirection[];

    @Column({ default: true })
    fillEmptyCells: boolean;

    @Column({ default: true })
    caseSensitive: boolean;

    @Column({ default: false })
    showWordList: boolean;

    @Column({ default: false })
    showClues: boolean;

    @Column({ default: 10 })
    pointsPerWord: number;

    @Column({ default: 5 })
    bonusForSpeed: number;

    @Column({ default: -2 })
    penaltyPerHint: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * Hook: si no se provee un seed al crear el juego,
     * generamos uno aleatorio automáticamente.
     */
    @BeforeInsert()
    generateSeed() {
        if (!this.seed) {
            this.seed = crypto.randomBytes(8).toString('hex');
        }
    }
}
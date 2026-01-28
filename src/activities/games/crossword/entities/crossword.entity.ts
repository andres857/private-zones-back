// src/activities/games/crossword/entities/crossword.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn, BeforeInsert
} from 'typeorm';
import { Activity } from '../../../entities/activity.entity';
import * as crypto from 'crypto';

export enum CrosswordDirection {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical'
}

export interface CrosswordWord {
    number: number;           // Número de la palabra en el crucigrama
    word: string;            // Palabra correcta
    clue: string;            // Pista
    direction: CrosswordDirection;
    row: number;             // Fila inicial
    col: number;             // Columna inicial
}

@Entity('crossword_games')
export class CrosswordGame {
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
     * El SEED para regenerar el mismo crucigrama
     */
    @Column({ type: 'varchar', length: 255 })
    seed: string;

    /**
     * Lista de palabras con sus posiciones y pistas
     */
    @Column({
        type: 'jsonb',
        default: []
    })
    words: CrosswordWord[];

    @Column({ default: false })
    caseSensitive: boolean;

    @Column({ default: true })
    showClueNumbers: boolean;

    @Column({ default: false })
    allowCheckLetter: boolean; // Permitir verificar letra individual

    @Column({ default: false })
    allowCheckWord: boolean;   // Permitir verificar palabra completa

    @Column({ default: false })
    autoCheckOnComplete: boolean; // Verificar automáticamente al completar

    @Column({ default: 10 })
    pointsPerWord: number;

    @Column({ default: 5 })
    bonusForPerfect: number;

    @Column({ default: -1 })
    penaltyPerCheck: number;

    @Column({ default: -2 })
    penaltyPerHint: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * Generar seed si no existe
     */
    @BeforeInsert()
    generateSeed() {
        if (!this.seed) {
            this.seed = crypto.randomBytes(8).toString('hex');
        }
    }
}
// src/activities/games/complete-phrase/entities/complete-phrase.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { Activity } from '../../../entities/activity.entity';

export enum BlankType {
    TEXT = 'text',           // Texto libre
    SELECT = 'select',       // Selección múltiple
    DRAG_DROP = 'drag_drop'  // Arrastrar y soltar
}

export interface BlankOption {
    text: string;
    isCorrect: boolean;
}

export interface PhraseBlank {
    id: number;              // Posición del blanco en la frase
    type: BlankType;
    correctAnswer: string;   // Respuesta correcta
    options?: BlankOption[]; // Opciones para SELECT o DRAG_DROP
    caseSensitive?: boolean;
    acceptSynonyms?: boolean;
    synonyms?: string[];     // Lista de sinónimos aceptados
}

export interface CompletePhraseItem {
    phrase: string;          // Frase con marcadores como {0}, {1}, etc.
    blanks: PhraseBlank[];
    category?: string;
    difficulty?: string;
    hint?: string;
}

@Entity('complete_phrase_games')
export class CompletePhraseGame {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Activity)
    @JoinColumn({ name: 'activityId' })
    activity: Activity;

    @Column()
    activityId: string;

    /**
     * Lista de frases a completar
     */
    @Column({
        type: 'jsonb',
        default: []
    })
    phrases: CompletePhraseItem[];

    @Column({ default: false })
    caseSensitive: boolean;

    @Column({ default: true })
    showHints: boolean;

    @Column({ default: false })
    shuffleOptions: boolean; // Mezclar opciones en SELECT

    @Column({ default: false })
    allowPartialCredit: boolean; // Dar puntos parciales

    @Column({ default: 10 })
    pointsPerBlank: number;

    @Column({ default: 5 })
    bonusForPerfect: number; // Bonus por completar todo sin errores

    @Column({ default: -1 })
    penaltyPerError: number;

    @Column({ default: -2 })
    penaltyPerHint: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
// src/activities/games/complete-phrase/complete-phrase.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompletePhraseGame, BlankType } from './entities/complete-phrase.entity';
import { Activity } from '../../entities/activity.entity';
import { CreateCompletePhraseDto, UpdateCompletePhraseDto } from './dto/create-complete-phrase.dto';

@Injectable()
export class CompletePhraseService {
    constructor(
        @InjectRepository(CompletePhraseGame)
        private readonly completePhraseRepository: Repository<CompletePhraseGame>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
    ) { }

    /**
     * Crea un nuevo juego de completar frases
     */
    async create(
        activityId: string,
        createDto: CreateCompletePhraseDto,
        tenantId: string,
    ): Promise<CompletePhraseGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        if (!createDto.phrases || createDto.phrases.length === 0) {
            throw new BadRequestException('Debe proporcionar al menos una frase');
        }

        // Validar que cada frase tenga al menos un blanco
        for (const phrase of createDto.phrases) {
            if (!phrase.blanks || phrase.blanks.length === 0) {
                throw new BadRequestException('Cada frase debe tener al menos un espacio en blanco');
            }
        }

        const completePhrase = this.completePhraseRepository.create({
            activityId,
            phrases: createDto.phrases,
            caseSensitive: createDto.caseSensitive ?? false,
            showHints: createDto.showHints ?? true,
            shuffleOptions: createDto.shuffleOptions ?? false,
            allowPartialCredit: createDto.allowPartialCredit ?? false,
            pointsPerBlank: createDto.pointsPerBlank ?? 10,
            bonusForPerfect: createDto.bonusForPerfect ?? 5,
            penaltyPerError: createDto.penaltyPerError ?? -1,
            penaltyPerHint: createDto.penaltyPerHint ?? -2,
        });

        return await this.completePhraseRepository.save(completePhrase);
    }

    /**
     * Obtiene un juego de completar frases por ID de actividad
     */
    async getByActivityId(activityId: string, tenantId: string): Promise<CompletePhraseGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const completePhrase = await this.completePhraseRepository.findOne({
            where: { activityId },
        });

        if (!completePhrase) {
            throw new NotFoundException('Juego de completar frases no encontrado');
        }

        return completePhrase;
    }

    /**
     * Genera los datos de juego (sin revelar respuestas correctas)
     */
    async generatePlayableData(
        activityId: string,
        tenantId: string,
        phraseIndex?: number,
    ): Promise<{
        phrase: string;
        blanks: Array<{
            id: number;
            type: BlankType;
            options?: Array<{ text: string }>;
        }>;
        category?: string;
        difficulty?: string;
        totalBlanks: number;
        shuffleOptions: boolean;
        hasMutiplePhrases: boolean;
        totalPhrases: number;
    }> {
        const completePhrase = await this.getByActivityId(activityId, tenantId);

        // Si no se especifica índice, elegir uno aleatorio
        const index = phraseIndex ?? Math.floor(Math.random() * completePhrase.phrases.length);

        if (index < 0 || index >= completePhrase.phrases.length) {
            throw new BadRequestException('Índice de frase inválido');
        }

        const selectedPhrase = completePhrase.phrases[index];

        // Preparar blancos sin revelar respuestas
        const playableBlanks = selectedPhrase.blanks.map(blank => {
            const playableBlank: any = {
                id: blank.id,
                type: blank.type,
            };

            // Si tiene opciones (SELECT o DRAG_DROP), incluirlas sin el flag isCorrect
            if (blank.options && blank.options.length > 0) {
                let options = blank.options.map(opt => ({ text: opt.text }));
                
                // Mezclar opciones si está configurado
                if (completePhrase.shuffleOptions) {
                    options = this.shuffleArray(options);
                }
                
                playableBlank.options = options;
            }

            return playableBlank;
        });

        return {
            phrase: selectedPhrase.phrase,
            blanks: playableBlanks,
            category: selectedPhrase.category,
            difficulty: selectedPhrase.difficulty,
            totalBlanks: selectedPhrase.blanks.length,
            shuffleOptions: completePhrase.shuffleOptions,
            hasMutiplePhrases: completePhrase.phrases.length > 1,
            totalPhrases: completePhrase.phrases.length,
        };
    }

    /**
     * Valida las respuestas del usuario
     */
    async validateAttempt(
        activityId: string,
        tenantId: string,
        phraseIndex: number,
        userAnswers: Array<{ blankId: number; answer: string }>,
        hintsUsed: number,
    ): Promise<{
        score: number;
        percentage: number;
        correctBlanks: number;
        incorrectBlanks: number;
        totalBlanks: number;
        isPerfect: boolean;
        details: Array<{
            blankId: number;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
        }>;
    }> {
        const completePhrase = await this.getByActivityId(activityId, tenantId);

        if (phraseIndex < 0 || phraseIndex >= completePhrase.phrases.length) {
            throw new BadRequestException('Índice de frase inválido');
        }

        const phrase = completePhrase.phrases[phraseIndex];
        const details: Array<{
            blankId: number;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
        }> = [];

        let correctBlanks = 0;
        let incorrectBlanks = 0;

        // Validar cada respuesta
        for (const blank of phrase.blanks) {
            const userAnswer = userAnswers.find(ua => ua.blankId === blank.id);
            
            if (!userAnswer) {
                incorrectBlanks++;
                details.push({
                    blankId: blank.id,
                    userAnswer: '',
                    correctAnswer: blank.correctAnswer,
                    isCorrect: false,
                });
                continue;
            }

            const isCorrect = this.checkAnswer(
                userAnswer.answer,
                blank.correctAnswer,
                blank.caseSensitive ?? completePhrase.caseSensitive,
                blank.acceptSynonyms,
                blank.synonyms,
            );

            if (isCorrect) {
                correctBlanks++;
            } else {
                incorrectBlanks++;
            }

            details.push({
                blankId: blank.id,
                userAnswer: userAnswer.answer,
                correctAnswer: blank.correctAnswer,
                isCorrect,
            });
        }

        const totalBlanks = phrase.blanks.length;
        const percentage = totalBlanks > 0 ? (correctBlanks / totalBlanks) * 100 : 0;
        const isPerfect = correctBlanks === totalBlanks;

        // Calcular puntaje
        let score = correctBlanks * completePhrase.pointsPerBlank;

        // Bonus por perfección
        if (isPerfect) {
            score += completePhrase.bonusForPerfect;
        }

        // Penalización por errores
        if (!completePhrase.allowPartialCredit && incorrectBlanks > 0) {
            score = 0; // Sin crédito parcial, si hay errores = 0 puntos
        } else {
            score += incorrectBlanks * completePhrase.penaltyPerError;
        }

        // Penalización por pistas
        score += hintsUsed * completePhrase.penaltyPerHint;

        // No permitir puntaje negativo
        score = Math.max(0, score);

        return {
            score,
            percentage,
            correctBlanks,
            incorrectBlanks,
            totalBlanks,
            isPerfect,
            details,
        };
    }

    /**
     * Obtiene una pista para un blanco específico
     */
    async getHint(
        activityId: string,
        tenantId: string,
        phraseIndex: number,
        blankId: number,
    ): Promise<{
        hint?: string;
        firstLetter?: string;
        wordLength?: number;
    }> {
        const completePhrase = await this.getByActivityId(activityId, tenantId);

        if (phraseIndex < 0 || phraseIndex >= completePhrase.phrases.length) {
            throw new BadRequestException('Índice de frase inválido');
        }

        const phrase = completePhrase.phrases[phraseIndex];
        const blank = phrase.blanks.find(b => b.id === blankId);

        if (!blank) {
            throw new BadRequestException('Blanco no encontrado');
        }

        // Si hay una pista general para la frase
        const hint: any = {};

        if (phrase.hint) {
            hint.hint = phrase.hint;
        }

        // Dar la primera letra como pista
        hint.firstLetter = blank.correctAnswer[0];
        hint.wordLength = blank.correctAnswer.length;

        return hint;
    }

    /**
     * Actualiza un juego de completar frases
     */
    async update(
        activityId: string,
        updateDto: UpdateCompletePhraseDto,
        tenantId: string,
    ): Promise<CompletePhraseGame> {
        const completePhrase = await this.getByActivityId(activityId, tenantId);

        Object.assign(completePhrase, updateDto);

        return await this.completePhraseRepository.save(completePhrase);
    }

    /**
     * Verifica si una respuesta es correcta
     */
    private checkAnswer(
        userAnswer: string,
        correctAnswer: string,
        caseSensitive: boolean,
        acceptSynonyms?: boolean,
        synonyms?: string[],
    ): boolean {
        const normalizedUser = caseSensitive 
            ? userAnswer.trim() 
            : userAnswer.trim().toLowerCase();
        
        const normalizedCorrect = caseSensitive 
            ? correctAnswer.trim() 
            : correctAnswer.trim().toLowerCase();

        // Verificar respuesta exacta
        if (normalizedUser === normalizedCorrect) {
            return true;
        }

        // Verificar sinónimos si están habilitados
        if (acceptSynonyms && synonyms && synonyms.length > 0) {
            const normalizedSynonyms = synonyms.map(s => 
                caseSensitive ? s.trim() : s.trim().toLowerCase()
            );
            return normalizedSynonyms.includes(normalizedUser);
        }

        return false;
    }

    /**
     * Mezcla un array aleatoriamente
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
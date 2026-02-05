// src/activities/games/hanging/hanging.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HangingGame } from './entities/hanging.entity';
import { Activity } from '../../entities/activity.entity';
import { CreateHangingDto, UpdateHangingDto } from './dto/create-hanging.dto';
import { ActivityConfiguration } from 'src/activities/entities/activity-config.entity';

@Injectable()
export class HangingService {
    constructor(
        @InjectRepository(HangingGame)
        private readonly hangingRepository: Repository<HangingGame>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        @InjectRepository(ActivityConfiguration)
        private readonly configRepository: Repository<ActivityConfiguration>,
    ) { }

    /**
     * Crea un nuevo juego de ahorcado
     */
    async create(
        activityId: string,
        createDto: CreateHangingDto,
        tenantId: string,
    ): Promise<HangingGame> {
        // 1. Validar que la actividad existe
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
            relations: ['configuration'], // 👈 Cargar la configuración
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        // 2. Validar que el tipo de actividad es correcto
        if (activity.type !== 'hanging') {
            throw new BadRequestException(
                'Esta actividad no es del tipo ahorcado'
            );
        }

        // 3. Validar palabras
        if (!createDto.words || createDto.words.length === 0) {
            throw new BadRequestException(
                'Debe proporcionar al menos una palabra'
            );
        }

        // 4. Crear el juego
        const hanging = this.hangingRepository.create({
            activityId,
            words: createDto.words,
            maxAttempts: createDto.maxAttempts ?? 6,
            caseSensitive: createDto.caseSensitive ?? false,
            showCategory: createDto.showCategory ?? true,
            showWordLength: createDto.showWordLength ?? false,
            pointsPerWord: createDto.pointsPerWord ?? 10,
            bonusForNoErrors: createDto.bonusForNoErrors ?? 5,
            penaltyPerError: createDto.penaltyPerError ?? -2,
            penaltyPerHint: createDto.penaltyPerHint ?? -3,
        });

        const savedHanging = await this.hangingRepository.save(hanging);

        // Actualizar o crear la configuración con gameData
        await this.updateActivityConfiguration(activity, savedHanging);

        return savedHanging;
    }

    /**
     * Actualiza la configuración de la actividad con los datos del juego
     */
    private async updateActivityConfiguration(
        activity: Activity,
        hangingGame: HangingGame,
    ): Promise<void> {
        const gameData = {
            type: 'hanging',
            gameId: hangingGame.id,
            wordsCount: hangingGame.words.length,
            maxAttempts: hangingGame.maxAttempts,
            pointsPerWord: hangingGame.pointsPerWord,
            bonusForNoErrors: hangingGame.bonusForNoErrors,
            // Metadata adicional que quieras exponer
            settings: {
                caseSensitive: hangingGame.caseSensitive,
                showCategory: hangingGame.showCategory,
                showWordLength: hangingGame.showWordLength,
            },
            createdAt: hangingGame.createdAt,
            updatedAt: hangingGame.updatedAt,
        };

        if (activity.configuration) {
            // Si ya existe configuración, actualizar gameData
            activity.configuration.gameData = gameData;
            await this.configRepository.save(activity.configuration);
        } else {
            // Si no existe, crear nueva configuración
            const newConfig = this.configRepository.create({
                activityId: activity.id,
                gameData,
                // Valores por defecto para otros campos
                showTimer: true,
                showScore: true,
                showHints: true,
                maxHints: 3,
                isGradable: true,
                showFeedbackAfterCompletion: true,
            });
            await this.configRepository.save(newConfig);
        }
    }

    /**
     * Obtiene un juego de ahorcado por ID de actividad
     */
    async getByActivityId(activityId: string, tenantId: string): Promise<HangingGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const hanging = await this.hangingRepository.findOne({
            where: { activityId },
        });

        if (!hanging) {
            throw new NotFoundException('Juego de ahorcado no encontrado');
        }

        return hanging;
    }

    /**
     * Genera los datos de juego (sin revelar la palabra)
     */
    async generatePlayableData(
        activityId: string,
        tenantId: string,
        wordIndex?: number,
    ): Promise<{
        wordLength: number;
        category?: string;
        maxAttempts: number;
        showWordLength: boolean;
        hasMultipleWords: boolean;
        totalWords: number;
    }> {
        const hanging = await this.getByActivityId(activityId, tenantId);

        // Si no se especifica índice, elegir uno aleatorio
        const index = wordIndex ?? Math.floor(Math.random() * hanging.words.length);

        if (index < 0 || index >= hanging.words.length) {
            throw new BadRequestException('Índice de palabra inválido');
        }

        const selectedWord = hanging.words[index];

        return {
            wordLength: selectedWord.word.length,
            category: hanging.showCategory ? selectedWord.category : undefined,
            maxAttempts: hanging.maxAttempts,
            showWordLength: hanging.showWordLength,
            hasMultipleWords: hanging.words.length > 1,
            totalWords: hanging.words.length,
        };
    }

    /**
     * Valida un intento completo de usuario
     */
    async validateAttempt(
        activityId: string,
        tenantId: string,
        wordIndex: number,
        guessedLetters: string[],
        hintsUsed: number,
    ): Promise<{
        isCorrect: boolean;
        correctWord: string;
        score: number;
        errorsCount: number;
        matchedLetters: string[];
        missedLetters: string[];
    }> {
        const hanging = await this.getByActivityId(activityId, tenantId);

        if (wordIndex < 0 || wordIndex >= hanging.words.length) {
            throw new BadRequestException('Índice de palabra inválido');
        }

        const targetWord = hanging.words[wordIndex].word;
        const normalizedTarget = hanging.caseSensitive 
            ? targetWord 
            : targetWord.toLowerCase();

        const normalizedGuesses = hanging.caseSensitive
            ? guessedLetters
            : guessedLetters.map(l => l.toLowerCase());

        // Letras únicas de la palabra objetivo
        const targetLetters = new Set(normalizedTarget.split('').filter(l => l.trim() !== ''));
        
        // Clasificar letras
        const matchedLetters = normalizedGuesses.filter(letter => 
            targetLetters.has(letter)
        );
        
        const missedLetters = normalizedGuesses.filter(letter => 
            !targetLetters.has(letter)
        );

        const errorsCount = missedLetters.length;
        const isCorrect = matchedLetters.length === targetLetters.size && errorsCount < hanging.maxAttempts;

        // Calcular puntaje
        let score = 0;
        if (isCorrect) {
            score = hanging.pointsPerWord;
            
            // Bonus por no cometer errores
            if (errorsCount === 0) {
                score += hanging.bonusForNoErrors;
            }
        }

        // Penalización por errores
        score += errorsCount * hanging.penaltyPerError;

        // Penalización por pistas
        score += hintsUsed * hanging.penaltyPerHint;

        // No permitir puntaje negativo
        score = Math.max(0, score);

        return {
            isCorrect,
            correctWord: targetWord,
            score,
            errorsCount,
            matchedLetters: Array.from(new Set(matchedLetters)),
            missedLetters: Array.from(new Set(missedLetters)),
        };
    }

    /**
     * Obtiene una pista para el jugador
     */
    async getHint(
        activityId: string,
        tenantId: string,
        wordIndex: number,
    ): Promise<{
        hint?: string;
        revealedLetter?: string;
        revealedPosition?: number;
    }> {
        const hanging = await this.getByActivityId(activityId, tenantId);

        if (wordIndex < 0 || wordIndex >= hanging.words.length) {
            throw new BadRequestException('Índice de palabra inválido');
        }

        const word = hanging.words[wordIndex];

        // Si hay pista configurada, devolverla
        if (word.clue) {
            return { hint: word.clue };
        }

        // Si no, revelar una letra aleatoria
        const randomIndex = Math.floor(Math.random() * word.word.length);
        return {
            revealedLetter: word.word[randomIndex],
            revealedPosition: randomIndex,
        };
    }

    /**
     * Actualiza un juego de ahorcado
     */
    async update(
        activityId: string,
        updateDto: UpdateHangingDto, // Puedes crear un UpdateHangingDto si necesitas
        tenantId: string,
    ): Promise<HangingGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
            relations: ['configuration'],
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const hanging = await this.hangingRepository.findOne({
            where: { activityId },
        });

        if (!hanging) {
            throw new NotFoundException('Juego de ahorcado no encontrado');
        }

        // Actualizar el juego
        Object.assign(hanging, {
            words: updateDto.words ?? hanging.words,
            maxAttempts: updateDto.maxAttempts ?? hanging.maxAttempts,
            caseSensitive: updateDto.caseSensitive ?? hanging.caseSensitive,
            showCategory: updateDto.showCategory ?? hanging.showCategory,
            showWordLength: updateDto.showWordLength ?? hanging.showWordLength,
            pointsPerWord: updateDto.pointsPerWord ?? hanging.pointsPerWord,
            bonusForNoErrors: updateDto.bonusForNoErrors ?? hanging.bonusForNoErrors,
            penaltyPerError: updateDto.penaltyPerError ?? hanging.penaltyPerError,
            penaltyPerHint: updateDto.penaltyPerHint ?? hanging.penaltyPerHint,
        });

        const updatedHanging = await this.hangingRepository.save(hanging);

        // 👇 Actualizar gameData
        await this.updateActivityConfiguration(activity, updatedHanging);

        return updatedHanging;
    }

    /**
     * Obtiene el juego de ahorcado de una actividad
     */
    async findByActivityId(
        activityId: string,
        tenantId: string,
    ): Promise<HangingGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const hanging = await this.hangingRepository.findOne({
            where: { activityId },
        });

        if (!hanging) {
            throw new NotFoundException('Juego de ahorcado no encontrado');
        }

        return hanging;
    }

    /**
     * Elimina el juego de ahorcado y limpia el gameData
     */
    async delete(activityId: string, tenantId: string): Promise<void> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
            relations: ['configuration'],
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const hanging = await this.hangingRepository.findOne({
            where: { activityId },
        });

        if (!hanging) {
            throw new NotFoundException('Juego de ahorcado no encontrado');
        }

        // Eliminar el juego
        await this.hangingRepository.remove(hanging);

        // Limpiar gameData de la configuración
        if (activity.configuration) {
            activity.configuration.gameData = null;
            await this.configRepository.save(activity.configuration);
        }
    }
}
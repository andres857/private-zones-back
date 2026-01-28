// src/activities/games/crossword/crossword.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrosswordGame, CrosswordDirection } from './entities/crossword.entity';
import { Activity } from '../../entities/activity.entity';
import { CreateCrosswordDto, UpdateCrosswordDto } from './dto/create-crossword.dto';

interface GridCell {
    letter: string | null;
    number?: number;
    isBlack: boolean;
}

@Injectable()
export class CrosswordService {
    constructor(
        @InjectRepository(CrosswordGame)
        private readonly crosswordRepository: Repository<CrosswordGame>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
    ) { }

    /**
     * Crea un nuevo juego de crucigrama
     */
    async create(
        activityId: string,
        createDto: CreateCrosswordDto,
        tenantId: string,
    ): Promise<CrosswordGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        if (!createDto.words || createDto.words.length === 0) {
            throw new BadRequestException('Debe proporcionar al menos una palabra');
        }

        // Validar dimensiones del grid
        const gridWidth = createDto.gridWidth || 15;
        const gridHeight = createDto.gridHeight || 15;

        if (gridWidth < 5 || gridWidth > 30) {
            throw new BadRequestException('El ancho del grid debe estar entre 5 y 30');
        }

        if (gridHeight < 5 || gridHeight > 30) {
            throw new BadRequestException('El alto del grid debe estar entre 5 y 30');
        }

        // Validar que las palabras caben en el grid
        this.validateWordsInGrid(createDto.words, gridWidth, gridHeight);

        const crossword = this.crosswordRepository.create({
            activityId,
            seed: createDto.seed,
            gridWidth,
            gridHeight,
            words: createDto.words,
            caseSensitive: createDto.caseSensitive ?? false,
            showClueNumbers: createDto.showClueNumbers ?? true,
            allowCheckLetter: createDto.allowCheckLetter ?? false,
            allowCheckWord: createDto.allowCheckWord ?? false,
            autoCheckOnComplete: createDto.autoCheckOnComplete ?? false,
            pointsPerWord: createDto.pointsPerWord ?? 10,
            bonusForPerfect: createDto.bonusForPerfect ?? 5,
            penaltyPerCheck: createDto.penaltyPerCheck ?? -1,
            penaltyPerHint: createDto.penaltyPerHint ?? -2,
        });

        return await this.crosswordRepository.save(crossword);
    }

    /**
     * Obtiene un crucigrama por ID de actividad
     */
    async getByActivityId(activityId: string, tenantId: string): Promise<CrosswordGame> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const crossword = await this.crosswordRepository.findOne({
            where: { activityId },
        });

        if (!crossword) {
            throw new NotFoundException('Crucigrama no encontrado');
        }

        return crossword;
    }

    /**
     * Genera el grid para jugar (sin revelar las respuestas)
     */
    async generatePlayableGrid(
        activityId: string,
        tenantId: string,
    ): Promise<{
        grid: Array<Array<{ number?: number; isBlack: boolean }>>;
        clues: {
            horizontal: Array<{ number: number; clue: string; length: number }>;
            vertical: Array<{ number: number; clue: string; length: number }>;
        };
        width: number;
        height: number;
        configuration: {
            caseSensitive: boolean;
            allowCheckLetter: boolean;
            allowCheckWord: boolean;
            autoCheckOnComplete: boolean;
        };
    }> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        // Crear grid vacío
        const grid: Array<Array<{ number?: number; isBlack: boolean }>> = [];
        for (let i = 0; i < crossword.gridHeight; i++) {
            grid[i] = [];
            for (let j = 0; j < crossword.gridWidth; j++) {
                grid[i][j] = { isBlack: true };
            }
        }

        // Marcar celdas con palabras y números
        const cluesHorizontal: Array<{ number: number; clue: string; length: number }> = [];
        const cluesVertical: Array<{ number: number; clue: string; length: number }> = [];

        for (const word of crossword.words) {
            if (word.direction === CrosswordDirection.HORIZONTAL) {
                for (let i = 0; i < word.word.length; i++) {
                    const cell = grid[word.row][word.col + i];
                    cell.isBlack = false;
                    if (i === 0 && crossword.showClueNumbers) {
                        cell.number = word.number;
                    }
                }
                cluesHorizontal.push({
                    number: word.number,
                    clue: word.clue,
                    length: word.word.length,
                });
            } else {
                for (let i = 0; i < word.word.length; i++) {
                    const cell = grid[word.row + i][word.col];
                    cell.isBlack = false;
                    if (i === 0 && crossword.showClueNumbers) {
                        cell.number = word.number;
                    }
                }
                cluesVertical.push({
                    number: word.number,
                    clue: word.clue,
                    length: word.word.length,
                });
            }
        }

        // Ordenar pistas por número
        cluesHorizontal.sort((a, b) => a.number - b.number);
        cluesVertical.sort((a, b) => a.number - b.number);

        return {
            grid,
            clues: {
                horizontal: cluesHorizontal,
                vertical: cluesVertical,
            },
            width: crossword.gridWidth,
            height: crossword.gridHeight,
            configuration: {
                caseSensitive: crossword.caseSensitive,
                allowCheckLetter: crossword.allowCheckLetter,
                allowCheckWord: crossword.allowCheckWord,
                autoCheckOnComplete: crossword.autoCheckOnComplete,
            },
        };
    }

    /**
     * Valida las respuestas del usuario
     */
    async validateAttempt(
        activityId: string,
        tenantId: string,
        userAnswers: Array<{ number: number; direction: CrosswordDirection; answer: string }>,
        checksUsed: number,
        hintsUsed: number,
    ): Promise<{
        score: number;
        percentage: number;
        correctWords: number;
        incorrectWords: number;
        totalWords: number;
        isPerfect: boolean;
        details: Array<{
            number: number;
            direction: CrosswordDirection;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
        }>;
    }> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        const details: Array<{
            number: number;
            direction: CrosswordDirection;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
        }> = [];

        let correctWords = 0;
        let incorrectWords = 0;

        // Validar cada palabra
        for (const word of crossword.words) {
            const userAnswer = userAnswers.find(
                ua => ua.number === word.number && ua.direction === word.direction
            );

            if (!userAnswer) {
                incorrectWords++;
                details.push({
                    number: word.number,
                    direction: word.direction,
                    userAnswer: '',
                    correctAnswer: word.word,
                    isCorrect: false,
                });
                continue;
            }

            const normalizedUser = crossword.caseSensitive
                ? userAnswer.answer.trim()
                : userAnswer.answer.trim().toUpperCase();

            const normalizedCorrect = crossword.caseSensitive
                ? word.word.trim()
                : word.word.trim().toUpperCase();

            const isCorrect = normalizedUser === normalizedCorrect;

            if (isCorrect) {
                correctWords++;
            } else {
                incorrectWords++;
            }

            details.push({
                number: word.number,
                direction: word.direction,
                userAnswer: userAnswer.answer,
                correctAnswer: word.word,
                isCorrect,
            });
        }

        const totalWords = crossword.words.length;
        const percentage = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
        const isPerfect = correctWords === totalWords;

        // Calcular puntaje
        let score = correctWords * crossword.pointsPerWord;

        // Bonus por perfección
        if (isPerfect) {
            score += crossword.bonusForPerfect;
        }

        // Penalización por verificaciones
        score += checksUsed * crossword.penaltyPerCheck;

        // Penalización por pistas
        score += hintsUsed * crossword.penaltyPerHint;

        // No permitir puntaje negativo
        score = Math.max(0, score);

        return {
            score,
            percentage,
            correctWords,
            incorrectWords,
            totalWords,
            isPerfect,
            details,
        };
    }

    /**
     * Verifica una letra específica
     */
    async checkLetter(
        activityId: string,
        tenantId: string,
        row: number,
        col: number,
        letter: string,
    ): Promise<{ isCorrect: boolean; correctLetter?: string }> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        if (!crossword.allowCheckLetter) {
            throw new BadRequestException('La verificación de letras no está permitida');
        }

        // Buscar qué palabra(s) contienen esta posición
        for (const word of crossword.words) {
            if (word.direction === CrosswordDirection.HORIZONTAL) {
                if (word.row === row && col >= word.col && col < word.col + word.word.length) {
                    const index = col - word.col;
                    const correctLetter = word.word[index];
                    const isCorrect = crossword.caseSensitive
                        ? letter === correctLetter
                        : letter.toUpperCase() === correctLetter.toUpperCase();
                    return { isCorrect, correctLetter: isCorrect ? undefined : correctLetter };
                }
            } else {
                if (word.col === col && row >= word.row && row < word.row + word.word.length) {
                    const index = row - word.row;
                    const correctLetter = word.word[index];
                    const isCorrect = crossword.caseSensitive
                        ? letter === correctLetter
                        : letter.toUpperCase() === correctLetter.toUpperCase();
                    return { isCorrect, correctLetter: isCorrect ? undefined : correctLetter };
                }
            }
        }

        throw new BadRequestException('No hay palabra en esta posición');
    }

    /**
     * Verifica una palabra completa
     */
    async checkWord(
        activityId: string,
        tenantId: string,
        wordNumber: number,
        direction: CrosswordDirection,
        answer: string,
    ): Promise<{ isCorrect: boolean; correctWord?: string }> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        if (!crossword.allowCheckWord) {
            throw new BadRequestException('La verificación de palabras no está permitida');
        }

        const word = crossword.words.find(
            w => w.number === wordNumber && w.direction === direction
        );

        if (!word) {
            throw new BadRequestException('Palabra no encontrada');
        }

        const normalizedUser = crossword.caseSensitive
            ? answer.trim()
            : answer.trim().toUpperCase();

        const normalizedCorrect = crossword.caseSensitive
            ? word.word.trim()
            : word.word.trim().toUpperCase();

        const isCorrect = normalizedUser === normalizedCorrect;

        return {
            isCorrect,
            correctWord: isCorrect ? undefined : word.word,
        };
    }

    /**
     * Obtiene una pista para una palabra
     */
    async getHint(
        activityId: string,
        tenantId: string,
        wordNumber: number,
        direction: CrosswordDirection,
    ): Promise<{
        hint: string;
        firstLetter: string;
        wordLength: number;
    }> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        const word = crossword.words.find(
            w => w.number === wordNumber && w.direction === direction
        );

        if (!word) {
            throw new BadRequestException('Palabra no encontrada');
        }

        return {
            hint: word.clue,
            firstLetter: word.word[0],
            wordLength: word.word.length,
        };
    }

    /**
     * Actualiza un crucigrama
     */
    async update(
        activityId: string,
        updateDto: UpdateCrosswordDto,
        tenantId: string,
    ): Promise<CrosswordGame> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        // Si se actualizan las palabras o dimensiones, validar
        if (updateDto.words || updateDto.gridWidth || updateDto.gridHeight) {
            const width = updateDto.gridWidth || crossword.gridWidth;
            const height = updateDto.gridHeight || crossword.gridHeight;
            const words = updateDto.words || crossword.words;

            this.validateWordsInGrid(words, width, height);

            // Generar nuevo seed
            const crypto = require('crypto');
            crossword.seed = crypto.randomBytes(8).toString('hex');
        }

        Object.assign(crossword, updateDto);

        return await this.crosswordRepository.save(crossword);
    }

    /**
     * Regenera el seed
     */
    async regenerateSeed(activityId: string, tenantId: string): Promise<CrosswordGame> {
        const crossword = await this.getByActivityId(activityId, tenantId);

        const crypto = require('crypto');
        crossword.seed = crypto.randomBytes(8).toString('hex');

        return await this.crosswordRepository.save(crossword);
    }

    /**
     * Valida que las palabras caben en el grid
     */
    private validateWordsInGrid(
        words: Array<{ word: string; direction: CrosswordDirection; row: number; col: number }>,
        gridWidth: number,
        gridHeight: number,
    ): void {
        for (const word of words) {
            if (word.direction === CrosswordDirection.HORIZONTAL) {
                if (word.col + word.word.length > gridWidth) {
                    throw new BadRequestException(
                        `La palabra "${word.word}" (horizontal) no cabe en el grid`
                    );
                }
                if (word.row >= gridHeight) {
                    throw new BadRequestException(
                        `La palabra "${word.word}" está fuera del grid (fila inválida)`
                    );
                }
            } else {
                if (word.row + word.word.length > gridHeight) {
                    throw new BadRequestException(
                        `La palabra "${word.word}" (vertical) no cabe en el grid`
                    );
                }
                if (word.col >= gridWidth) {
                    throw new BadRequestException(
                        `La palabra "${word.word}" está fuera del grid (columna inválida)`
                    );
                }
            }
        }
    }
}
// src/activities/games/word-search/word-search.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordSearchGame } from './entities/word-search.entity';
import { Activity } from '../../entities/activity.entity';
import { WordSearchGeneratorService, GeneratedGrid } from './word-search-generator.service';
import { CreateWordSearchDto, UpdateWordSearchDto } from './dto/create-word-search.dto';

@Injectable()
export class WordSearchService {
    constructor(
        @InjectRepository(WordSearchGame)
        private readonly wordSearchRepository: Repository<WordSearchGame>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        private readonly generatorService: WordSearchGeneratorService,
    ) { }

    /**
     * Crea un nuevo juego de sopa de letras
     */
    async create(
        activityId: string,
        createDto: CreateWordSearchDto,
        tenantId: string,
    ): Promise<WordSearchGame> {
        // Verificar que la actividad existe y pertenece al tenant
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        // Validar que hay palabras
        if (!createDto.words || createDto.words.length === 0) {
            throw new BadRequestException('Debe proporcionar al menos una palabra');
        }

        // Validar dimensiones del grid
        if (createDto.gridWidth < 10 || createDto.gridWidth > 30) {
            throw new BadRequestException('El ancho del grid debe estar entre 10 y 30');
        }

        if (createDto.gridHeight < 10 || createDto.gridHeight > 30) {
            throw new BadRequestException('El alto del grid debe estar entre 10 y 30');
        }

        // Crear el juego (el seed se genera automáticamente si no se proporciona)
        const wordSearch = this.wordSearchRepository.create({
            activityId,
            seed: createDto.seed, // Usar seed personalizado si se proporciona
            gridWidth: createDto.gridWidth,
            gridHeight: createDto.gridHeight,
            words: createDto.words,
            allowedDirections: createDto.allowedDirections,
            fillEmptyCells: createDto.fillEmptyCells ?? true,
            caseSensitive: createDto.caseSensitive ?? false,
            showWordList: createDto.showWordList ?? true,
            showClues: createDto.showClues ?? false,
            pointsPerWord: createDto.pointsPerWord ?? 10,
            bonusForSpeed: createDto.bonusForSpeed ?? 5,
            penaltyPerHint: createDto.penaltyPerHint ?? -2,
        });

        // Guardar y retornar
        return await this.wordSearchRepository.save(wordSearch);
    }

    /**
     * Obtiene un juego de sopa de letras por ID de actividad
     */
    async getByActivityId(activityId: string, tenantId: string): Promise<WordSearchGame> {
        // Verificar que la actividad pertenece al tenant
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, tenantId },
        });

        if (!activity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        const wordSearch = await this.wordSearchRepository.findOne({
            where: { activityId },
        });

        if (!wordSearch) {
            throw new NotFoundException('Sopa de letras no encontrada');
        }

        return wordSearch;
    }

    /**
     * Genera el grid para jugar (sin revelar las posiciones de las palabras)
     */
    async generatePlayableGrid(
        activityId: string,
        tenantId: string,
    ): Promise<{
        grid: string[][];
        words: Array<{ word?: string; clue?: string; category?: string }>;
        width: number;
        height: number;
        configuration: {
            showWordList: boolean;
            showClues: boolean;
            caseSensitive: boolean;
        };
    }> {
        const wordSearch = await this.getByActivityId(activityId, tenantId);

        // Generar el grid usando el seed
        const generatedGrid = this.generatorService.generateGrid(
            wordSearch.words,
            wordSearch.gridWidth,
            wordSearch.gridHeight,
            wordSearch.allowedDirections,
            wordSearch.seed,
            wordSearch.fillEmptyCells,
        );

        // Convertir grid de objetos a matriz simple de letras
        const simpleGrid: string[][] = generatedGrid.grid.map(row =>
            row.map(cell => cell.letter)
        );

        // Preparar lista de palabras/pistas según configuración
        const wordList = wordSearch.words.map(w => {
            if (wordSearch.showClues && w.clue) {
                return { clue: w.clue, category: w.category };
            } else if (wordSearch.showWordList) {
                return { word: w.word, category: w.category };
            } else {
                return { category: w.category };
            }
        });

        return {
            grid: simpleGrid,
            words: wordList,
            width: wordSearch.gridWidth,
            height: wordSearch.gridHeight,
            configuration: {
                showWordList: wordSearch.showWordList,
                showClues: wordSearch.showClues,
                caseSensitive: wordSearch.caseSensitive,
            },
        };
    }

    /**
     * Genera el grid completo para administradores (con posiciones de palabras)
     */
    async generateAdminGrid(
        activityId: string,
        tenantId: string,
    ): Promise<GeneratedGrid> {
        const wordSearch = await this.getByActivityId(activityId, tenantId);

        return this.generatorService.generateGrid(
            wordSearch.words,
            wordSearch.gridWidth,
            wordSearch.gridHeight,
            wordSearch.allowedDirections,
            wordSearch.seed,
            wordSearch.fillEmptyCells,
        );
    }

    /**
     * Valida las palabras encontradas por un usuario
     */
    async validateAttempt(
        activityId: string,
        tenantId: string,
        userFoundWords: Array<{
            word: string;
            startRow: number;
            startCol: number;
            endRow: number;
            endCol: number;
        }>,
    ): Promise<{
        score: number;
        percentage: number;
        correct: number;
        incorrect: number;
        missing: number;
        details: Array<{ word: string; isCorrect: boolean }>;
    }> {
        const wordSearch = await this.getByActivityId(activityId, tenantId);

        // Regenerar el grid para obtener las posiciones correctas
        const generatedGrid = this.generatorService.generateGrid(
            wordSearch.words,
            wordSearch.gridWidth,
            wordSearch.gridHeight,
            wordSearch.allowedDirections,
            wordSearch.seed,
            wordSearch.fillEmptyCells,
        );

        // Validar las palabras
        const validation = this.generatorService.validateFoundWords(
            userFoundWords,
            generatedGrid.placedWords,
        );

        // Calcular puntaje
        const score = validation.correct * wordSearch.pointsPerWord;
        const totalWords = wordSearch.words.length;
        const percentage = totalWords > 0 ? (validation.correct / totalWords) * 100 : 0;

        return {
            score,
            percentage,
            ...validation,
        };
    }

    /**
     * Actualiza un juego de sopa de letras
     */
    async update(
        activityId: string,
        updateDto: UpdateWordSearchDto,
        tenantId: string,
    ): Promise<WordSearchGame> {
        const wordSearch = await this.getByActivityId(activityId, tenantId);

        // Si se actualizan las palabras o dimensiones, generar nuevo seed
        if (updateDto.words || updateDto.gridWidth || updateDto.gridHeight) {
            // Generar nuevo seed para crear un tablero diferente
            const crypto = require('crypto');
            wordSearch.seed = crypto.randomBytes(8).toString('hex');
        }

        // Actualizar campos
        Object.assign(wordSearch, updateDto);

        return await this.wordSearchRepository.save(wordSearch);
    }

    /**
     * Regenera el seed para crear un nuevo tablero con las mismas palabras
     */
    async regenerateSeed(activityId: string, tenantId: string): Promise<WordSearchGame> {
        const wordSearch = await this.getByActivityId(activityId, tenantId);

        const crypto = require('crypto');
        wordSearch.seed = crypto.randomBytes(8).toString('hex');

        return await this.wordSearchRepository.save(wordSearch);
    }

    /**
     * Obtiene una pista para una palabra específica
     */
    async getHint(
        activityId: string,
        tenantId: string,
        wordIndex: number,
    ): Promise<{
        hint: string;
        wordLength: number;
        firstLetter?: string;
    }> {
        const wordSearch = await this.getByActivityId(activityId, tenantId);

        if (wordIndex < 0 || wordIndex >= wordSearch.words.length) {
            throw new BadRequestException('Índice de palabra inválido');
        }

        const word = wordSearch.words[wordIndex];

        return {
            hint: word.clue || `Palabra de ${word.word.length} letras`,
            wordLength: word.word.length,
            firstLetter: wordSearch.showClues ? word.word[0] : undefined,
        };
    }
}
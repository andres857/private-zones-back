// src/activities/games/word-search/word-search-generator.service.ts
import { Injectable } from '@nestjs/common';
import { WordDirection, WordItem } from './entities/word-search.entity';

export interface GridCell {
    letter: string;
    row: number;
    col: number;
    isPartOfWord?: boolean;
    wordId?: number; // índice de la palabra en el array
}

export interface PlacedWord {
    word: string;
    startRow: number;
    startCol: number;
    direction: WordDirection;
    clue?: string;
    category?: string;
}

export interface GeneratedGrid {
    grid: GridCell[][];
    placedWords: PlacedWord[];
    width: number;
    height: number;
}

/**
 * Generador determinístico de sopas de letras usando SEED
 * El mismo seed + palabras siempre genera el mismo tablero
 */
@Injectable()
export class WordSearchGeneratorService {
    private readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Generador de números pseudoaleatorios seeded
    private rng: () => number;
    private seed: number;

    /**
     * Genera una sopa de letras determinística
     */
    generateGrid(
        words: WordItem[],
        width: number,
        height: number,
        allowedDirections: WordDirection[],
        seed: string,
        fillEmptyCells: boolean = true
    ): GeneratedGrid {
        // Inicializar RNG con seed
        this.initializeRNG(seed);

        // Crear grid vacío
        const grid: GridCell[][] = this.createEmptyGrid(width, height);
        const placedWords: PlacedWord[] = [];

        // Ordenar palabras por longitud (más largas primero) para mejor colocación
        const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);

        // Intentar colocar cada palabra
        for (let i = 0; i < sortedWords.length; i++) {
            const wordItem = sortedWords[i];
            const placed = this.placeWord(grid, wordItem, allowedDirections, i);
            if (placed) {
                placedWords.push(placed);
            }
        }

        // Llenar celdas vacías con letras aleatorias
        if (fillEmptyCells) {
            this.fillEmptyCells(grid);
        }

        return {
            grid,
            placedWords,
            width,
            height
        };
    }

    /**
     * Inicializa el generador de números aleatorios con el seed
     */
    private initializeRNG(seedString: string): void {
        // Convertir string seed a número
        this.seed = this.hashCode(seedString);
        this.rng = this.seededRandom.bind(this);
    }

    /**
     * Generador de números pseudoaleatorios seeded (Linear Congruential Generator)
     */
    private seededRandom(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    /**
     * Convierte un string a un hash numérico
     */
    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Crea un grid vacío
     */
    private createEmptyGrid(width: number, height: number): GridCell[][] {
        const grid: GridCell[][] = [];
        for (let row = 0; row < height; row++) {
            grid[row] = [];
            for (let col = 0; col < width; col++) {
                grid[row][col] = {
                    letter: '',
                    row,
                    col,
                    isPartOfWord: false
                };
            }
        }
        return grid;
    }

    /**
     * Intenta colocar una palabra en el grid
     */
    private placeWord(
        grid: GridCell[][],
        wordItem: WordItem,
        allowedDirections: WordDirection[],
        wordId: number,
        maxAttempts: number = 100
    ): PlacedWord | null {
        const word = wordItem.word.toUpperCase();
        const height = grid.length;
        const width = grid[0].length;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Seleccionar dirección aleatoria
            const direction = allowedDirections[Math.floor(this.rng() * allowedDirections.length)];
            
            // Seleccionar posición inicial aleatoria
            const startRow = Math.floor(this.rng() * height);
            const startCol = Math.floor(this.rng() * width);

            // Verificar si la palabra cabe
            if (this.canPlaceWord(grid, word, startRow, startCol, direction)) {
                // Colocar la palabra
                this.placeWordInGrid(grid, word, startRow, startCol, direction, wordId);
                return {
                    word: wordItem.word,
                    startRow,
                    startCol,
                    direction,
                    clue: wordItem.clue,
                    category: wordItem.category
                };
            }
        }

        return null; // No se pudo colocar la palabra
    }

    /**
     * Verifica si una palabra puede ser colocada en una posición específica
     */
    private canPlaceWord(
        grid: GridCell[][],
        word: string,
        startRow: number,
        startCol: number,
        direction: WordDirection
    ): boolean {
        const height = grid.length;
        const width = grid[0].length;
        const deltas = this.getDirectionDeltas(direction);

        for (let i = 0; i < word.length; i++) {
            const row = startRow + deltas.row * i;
            const col = startCol + deltas.col * i;

            // Verificar límites
            if (row < 0 || row >= height || col < 0 || col >= width) {
                return false;
            }

            // Verificar si la celda está vacía o tiene la misma letra
            const cell = grid[row][col];
            if (cell.letter !== '' && cell.letter !== word[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Coloca una palabra en el grid
     */
    private placeWordInGrid(
        grid: GridCell[][],
        word: string,
        startRow: number,
        startCol: number,
        direction: WordDirection,
        wordId: number
    ): void {
        const deltas = this.getDirectionDeltas(direction);

        for (let i = 0; i < word.length; i++) {
            const row = startRow + deltas.row * i;
            const col = startCol + deltas.col * i;
            
            grid[row][col] = {
                letter: word[i],
                row,
                col,
                isPartOfWord: true,
                wordId
            };
        }
    }

    /**
     * Obtiene los deltas de fila y columna para cada dirección
     */
    private getDirectionDeltas(direction: WordDirection): { row: number; col: number } {
        switch (direction) {
            case WordDirection.HORIZONTAL:
                return { row: 0, col: 1 };
            case WordDirection.HORIZONTAL_REVERSE:
                return { row: 0, col: -1 };
            case WordDirection.VERTICAL:
                return { row: 1, col: 0 };
            case WordDirection.VERTICAL_REVERSE:
                return { row: -1, col: 0 };
            case WordDirection.DIAGONAL_DOWN:
                return { row: 1, col: 1 };
            case WordDirection.DIAGONAL_DOWN_REVERSE:
                return { row: -1, col: -1 };
            case WordDirection.DIAGONAL_UP:
                return { row: -1, col: 1 };
            case WordDirection.DIAGONAL_UP_REVERSE:
                return { row: 1, col: -1 };
            default:
                return { row: 0, col: 1 };
        }
    }

    /**
     * Llena las celdas vacías con letras aleatorias
     */
    private fillEmptyCells(grid: GridCell[][]): void {
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col].letter === '') {
                    const randomIndex = Math.floor(this.rng() * this.ALPHABET.length);
                    grid[row][col].letter = this.ALPHABET[randomIndex];
                }
            }
        }
    }

    /**
     * Regenera un grid usando el mismo seed y palabras
     * Útil para validar respuestas del usuario
     */
    regenerateGrid(
        words: WordItem[],
        width: number,
        height: number,
        allowedDirections: WordDirection[],
        seed: string,
        fillEmptyCells: boolean = true
    ): GeneratedGrid {
        return this.generateGrid(words, width, height, allowedDirections, seed, fillEmptyCells);
    }

    /**
     * Valida si las palabras encontradas por el usuario son correctas
     */
    validateFoundWords(
        userFoundWords: Array<{
            word: string;
            startRow: number;
            startCol: number;
            endRow: number;
            endCol: number;
        }>,
        correctWords: PlacedWord[]
    ): {
        correct: number;
        incorrect: number;
        missing: number;
        details: Array<{ word: string; isCorrect: boolean }>;
    } {
        const details: Array<{ word: string; isCorrect: boolean }> = [];
        let correct = 0;
        let incorrect = 0;

        for (const userWord of userFoundWords) {
            const found = correctWords.find(cw => {
                const deltas = this.getDirectionDeltas(cw.direction);
                const endRow = cw.startRow + deltas.row * (cw.word.length - 1);
                const endCol = cw.startCol + deltas.col * (cw.word.length - 1);

                return (
                    cw.word.toUpperCase() === userWord.word.toUpperCase() &&
                    cw.startRow === userWord.startRow &&
                    cw.startCol === userWord.startCol &&
                    endRow === userWord.endRow &&
                    endCol === userWord.endCol
                );
            });

            if (found) {
                correct++;
                details.push({ word: userWord.word, isCorrect: true });
            } else {
                incorrect++;
                details.push({ word: userWord.word, isCorrect: false });
            }
        }

        const missing = correctWords.length - correct;

        return {
            correct,
            incorrect,
            missing,
            details
        };
    }
}
// src/activities/activities.service.ts
import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Activity, ActivityStatus, ActivityType } from './entities/activity.entity';
import { ActivityConfiguration } from './entities/activity-config.entity';
import { ActivityTranslation } from './entities/activity-translation.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { WordSearchService } from './games/word-search/word-search.service';
import { HangingService } from './games/hanging/hanging.service';
import { CompletePhraseService } from './games/complete-phrase/complete-phrase.service';
import { CrosswordService } from './games/crossword/crossword.service';

interface GetAllByCourseParams {
    courseId: string;
    search?: string;
    actives?: boolean;
    type?: ActivityType;
    page: number;
    limit: number;
    tenantId: string;
}

interface CreateActivityParams extends CreateActivityDto {
    tenantId: string;
}

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        @InjectRepository(ActivityTranslation)
        private readonly translationRepository: Repository<ActivityTranslation>,
        @InjectRepository(ActivityConfiguration)
        private readonly configurationRepository: Repository<ActivityConfiguration>,
        @InjectRepository(Courses)
        private readonly coursesRepository: Repository<Courses>,
        private readonly dataSource: DataSource,
        @Inject(forwardRef(() => WordSearchService))
        private readonly wordSearchService: WordSearchService,
        @Inject(forwardRef(() => HangingService))
        private readonly hangingService: HangingService,
        @Inject(forwardRef(() => CompletePhraseService))
        private readonly completePhraseService: CompletePhraseService,
        @Inject(forwardRef(() => CrosswordService))
        private readonly crosswordService: CrosswordService,
    ) { }

    async getAllByCourse(params: GetAllByCourseParams) {
        const { courseId, search, actives, type, page, limit, tenantId } = params;

        const queryBuilder = this.activityRepository
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.translations', 'translations')
            .leftJoinAndSelect('activity.configuration', 'configuration')
            .where('activity.tenantId = :tenantId', { tenantId })
            .andWhere('activity.courseId = :courseId', { courseId });

        if (actives !== undefined) {
            queryBuilder.andWhere('activity.isActive = :isActive', { isActive: actives });
        }

        if (type) {
            queryBuilder.andWhere('activity.type = :type', { type });
        }

        if (search && search.trim() !== '') {
            queryBuilder.andWhere(
                '(translations.title ILIKE :search OR translations.description ILIKE :search OR activity.slug ILIKE :search)',
                { search: `%${search.trim()}%` }
            );
        }

        queryBuilder
            .orderBy('activity.order', 'ASC')
            .addOrderBy('activity.created_at', 'DESC');

        const total = await queryBuilder.getCount();

        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        const activities = await queryBuilder.getMany();

        const statsQuery = this.activityRepository
            .createQueryBuilder('activity')
            .where('activity.tenantId = :tenantId', { tenantId })
            .andWhere('activity.courseId = :courseId', { courseId });

        const [
            totalActive,
            totalDraft,
            totalPublished,
            totalArchived
        ] = await Promise.all([
            statsQuery.clone().andWhere('activity.isActive = true').getCount(),
            statsQuery.clone().andWhere('activity.status = :status', { status: ActivityStatus.DRAFT }).getCount(),
            statsQuery.clone().andWhere('activity.status = :status', { status: ActivityStatus.PUBLISHED }).getCount(),
            statsQuery.clone().andWhere('activity.status = :status', { status: ActivityStatus.ARCHIVED }).getCount(),
        ]);

        return {
            data: activities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
            stats: {
                total,
                totalActive,
                totalInactive: total - totalActive,
                totalDraft,
                totalPublished,
                totalArchived,
            },
        };
    }

    async getById(id: string, tenantId: string): Promise<Activity> {
        try {
            const activity = await this.activityRepository
                .createQueryBuilder('activity')
                .leftJoinAndSelect('activity.translations', 'translations')
                .leftJoinAndSelect('activity.configuration', 'configuration')
                .where('activity.id = :id', { id })
                .andWhere('activity.tenantId = :tenantId', { tenantId })
                .getOne();

            if (!activity) {
                throw new NotFoundException('Actividad no encontrada');
            }

            return activity;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al obtener la actividad');
        }
    }

    async create(params: CreateActivityParams): Promise<Activity> {
        const { tenantId, courseId, translations, configuration, ...activityData } = params;

        const course = await this.coursesRepository.findOne({
            where: { id: courseId, tenantId },
        });

        if (!course) {
            throw new NotFoundException('Curso no encontrado');
        }

        const baseSlug = this.generateSlug(translations[0].title);
        const slug = await this.generateUniqueSlug(baseSlug, tenantId);

        let order = activityData.order;
        if (order === undefined) {
            const lastActivity = await this.activityRepository.findOne({
                where: { courseId, tenantId },
                order: { order: 'DESC' },
            });
            order = lastActivity ? lastActivity.order + 1 : 0;
        }

        const result = await this.dataSource.transaction(async (manager) => {
            const activity = manager.create(Activity, {
                slug,
                tenantId,
                courseId,
                type: activityData.type || ActivityType.WORD_SEARCH,
                status: activityData.status || ActivityStatus.DRAFT,
                difficulty: activityData.difficulty,
                isActive: activityData.isActive !== undefined ? activityData.isActive : true,
                order,
                maxScore: activityData.maxScore || 100,
                configuration: {
                    ...configuration,
                    isGradable: configuration?.isGradable !== undefined ? configuration.isGradable : true,
                    maxAttempts: configuration?.maxAttempts || 0,
                    showTimer: configuration?.showTimer !== undefined ? configuration.showTimer : true,
                    showScore: configuration?.showScore !== undefined ? configuration.showScore : true,
                    showHints: configuration?.showHints !== undefined ? configuration.showHints : true,
                    maxHints: configuration?.maxHints || 3,
                    showScoreImmediately: configuration?.showScoreImmediately !== undefined ? configuration.showScoreImmediately : true,
                    showFeedbackAfterCompletion: configuration?.showFeedbackAfterCompletion !== undefined ? configuration.showFeedbackAfterCompletion : true,
                }
            });

            const savedActivity = await manager.save(Activity, activity);

            const translationEntities = translations.map(t =>
                manager.create(ActivityTranslation, {
                    ...t,
                    activity: savedActivity,
                })
            );
            await manager.save(ActivityTranslation, translationEntities);

            const finalActivity = await manager.findOne(Activity, {
                where: { id: savedActivity.id },
                relations: ['translations', 'configuration'],
            });

            if (!finalActivity) {
                throw new BadRequestException('Error al crear la actividad');
            }

            return finalActivity;
        });

        // 🎮 CREAR EL JUEGO ESPECÍFICO según el tipo de actividad
        await this.createGameForActivity(result, configuration?.gameData, tenantId);

        return result;
    }

    async update(id: string, params: Partial<UpdateActivityDto & { tenantId: string }>): Promise<Activity> {
        const { tenantId, translations, configuration, ...activityData } = params;

        const existingActivity = await this.activityRepository.findOne({
            where: { id, tenantId },
            relations: ['translations', 'configuration'],
        });

        if (!existingActivity) {
            throw new NotFoundException('Actividad no encontrada');
        }

        if (activityData.courseId && activityData.courseId !== existingActivity.courseId) {
            const course = await this.coursesRepository.findOne({
                where: { id: activityData.courseId, tenantId },
            });

            if (!course) {
                throw new NotFoundException('Curso no encontrado');
            }
        }

        const result = await this.dataSource.transaction(async (manager) => {
            if (Object.keys(activityData).length > 0) {
                await manager.update(Activity, id, activityData);
            }

            if (configuration && existingActivity.configuration) {
                await manager.update(
                    ActivityConfiguration,
                    existingActivity.configuration.id,
                    configuration
                );
            }

            if (translations && translations.length > 0) {
                for (const translationDto of translations) {
                    const existingTranslation = existingActivity.translations.find(
                        t => t.languageCode === translationDto.languageCode
                    );

                    if (existingTranslation) {
                        await manager.update(
                            ActivityTranslation,
                            existingTranslation.id,
                            translationDto
                        );
                    } else {
                        const newTranslation = manager.create(ActivityTranslation, {
                            ...translationDto,
                            activityId: id,
                        });
                        await manager.save(ActivityTranslation, newTranslation);
                    }
                }
            }

            const updatedActivity = await manager.findOne(Activity, {
                where: { id },
                relations: ['translations', 'configuration'],
            });

            if (!updatedActivity) {
                throw new BadRequestException('Error al actualizar la actividad');
            }

            return updatedActivity;
        });

        return result;
    }


    /**
     * Crea el juego específico basado en el tipo de actividad
     */
    private async createGameForActivity(
        activity: Activity,
        gameData: any,
        tenantId: string
    ): Promise<void> {
        // Si no hay gameData, no hacer nada
        if (!gameData) {
            return;
        }

        switch (activity.type) {
            case ActivityType.WORD_SEARCH:
                await this.createWordSearchGame(activity.id, gameData, tenantId);
                break;
            case ActivityType.HANGING:
                await this.createHangingGame(activity.id, gameData, tenantId);
                break;
            case ActivityType.COMPLETE_PHRASE:
                await this.createCompletePhraseGame(activity.id, gameData, tenantId);
                break;
            case ActivityType.CROSSWORD:
                await this.createCrosswordGame(activity.id, gameData, tenantId);
                break;

            // case ActivityType.CROSSWORD:
            //     await this.createCrosswordGame(activity.id, gameData, tenantId);
            //     break;
            
            // case ActivityType.QUIZ:
            //     await this.createQuizGame(activity.id, gameData, tenantId);
            //     break;

            default:
                console.log(`No se requiere crear juego para el tipo: ${activity.type}`);
        }
    }

    /**
     * Crea un juego de sopa de letras
     */
    private async createWordSearchGame(
        activityId: string,
        gameData: any,
        tenantId: string
    ): Promise<void> {
        try {
            await this.wordSearchService.create(activityId, {
                gridWidth: gameData.gridWidth || 15,
                gridHeight: gameData.gridHeight || 15,
                words: gameData.words || [],
                allowedDirections: gameData.allowedDirections || [
                    'horizontal',
                    'vertical',
                    'diagonal_down'
                ],
                seed: gameData.seed,
                fillEmptyCells: gameData.fillEmptyCells ?? true,
                caseSensitive: gameData.caseSensitive ?? false,
                showWordList: gameData.showWordList ?? true,
                showClues: gameData.showClues ?? false,
                pointsPerWord: gameData.pointsPerWord ?? 10,
                bonusForSpeed: gameData.bonusForSpeed ?? 5,
                penaltyPerHint: gameData.penaltyPerHint ?? -2,
            }, tenantId);
        } catch (error) {
            console.error('Error creando juego de sopa de letras:', error);
            throw new BadRequestException('Error al crear el juego de sopa de letras');
        }
    }

    /**
     * Crea un juego de ahorcado
     */
    private async createHangingGame(
        activityId: string,
        gameData: any,
        tenantId: string
    ): Promise<void> {
        try {
            await this.hangingService.create(activityId, {
                words: gameData.words || [],
                maxAttempts: gameData.maxAttempts ?? 6,
                caseSensitive: gameData.caseSensitive ?? false,
                showCategory: gameData.showCategory ?? true,
                showWordLength: gameData.showWordLength ?? false,
                pointsPerWord: gameData.pointsPerWord ?? 10,
                bonusForNoErrors: gameData.bonusForNoErrors ?? 5,
                penaltyPerError: gameData.penaltyPerError ?? -2,
                penaltyPerHint: gameData.penaltyPerHint ?? -3,
            }, tenantId);
        } catch (error) {
            console.error('Error creando juego de ahorcado:', error);
            throw new BadRequestException('Error al crear el juego de ahorcado');
        }
    }

    // Agregar método:
    /**
     * Crea un juego de completar frases
     */
    private async createCompletePhraseGame(
        activityId: string,
        gameData: any,
        tenantId: string
    ): Promise<void> {
        try {
            await this.completePhraseService.create(activityId, {
                phrases: gameData.phrases || [],
                caseSensitive: gameData.caseSensitive ?? false,
                showHints: gameData.showHints ?? true,
                shuffleOptions: gameData.shuffleOptions ?? false,
                allowPartialCredit: gameData.allowPartialCredit ?? false,
                pointsPerBlank: gameData.pointsPerBlank ?? 10,
                bonusForPerfect: gameData.bonusForPerfect ?? 5,
                penaltyPerError: gameData.penaltyPerError ?? -1,
                penaltyPerHint: gameData.penaltyPerHint ?? -2,
            }, tenantId);
        } catch (error) {
            console.error('Error creando juego de completar frases:', error);
            throw new BadRequestException('Error al crear el juego de completar frases');
        }
    }

    /**
     * Crea un crucigrama
     */
    private async createCrosswordGame(
        activityId: string,
        gameData: any,
        tenantId: string
    ): Promise<void> {
        try {
            await this.crosswordService.create(activityId, {
                gridWidth: gameData.gridWidth || 15,
                gridHeight: gameData.gridHeight || 15,
                seed: gameData.seed,
                words: gameData.words || [],
                caseSensitive: gameData.caseSensitive ?? false,
                showClueNumbers: gameData.showClueNumbers ?? true,
                allowCheckLetter: gameData.allowCheckLetter ?? false,
                allowCheckWord: gameData.allowCheckWord ?? false,
                autoCheckOnComplete: gameData.autoCheckOnComplete ?? false,
                pointsPerWord: gameData.pointsPerWord ?? 10,
                bonusForPerfect: gameData.bonusForPerfect ?? 5,
                penaltyPerCheck: gameData.penaltyPerCheck ?? -1,
                penaltyPerHint: gameData.penaltyPerHint ?? -2,
            }, tenantId);
        } catch (error) {
            console.error('Error creando crucigrama:', error);
            throw new BadRequestException('Error al crear el crucigrama');
        }
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    private async generateUniqueSlug(baseSlug: string, tenantId: string): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (await this.activityRepository.findOne({ where: { slug, tenantId } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }
}
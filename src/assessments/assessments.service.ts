import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Assessment, AssessmentStatus, AssessmentType } from './entities/assessment.entity';
import { AssessmentConfiguration, GradingMethod, QuestionOrderMode } from './entities/assessment-config.entity';
import { AssessmentTranslation } from './entities/assessment-translation.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentParams } from './interfaces/update-assessment-params.interface';

interface GetAllByCourseParams {
    courseId: string;
    search?: string;
    actives?: boolean;
    page: number;
    limit: number;
    tenantId: string;
}

interface CreateAssessmentParams extends CreateAssessmentDto {
    tenantId: string;
}

@Injectable()
export class AssessmentsService {
    constructor(
        @InjectRepository(Assessment)
        private readonly assessmentRepository: Repository<Assessment>,
        @InjectRepository(AssessmentTranslation)
        private readonly translationRepository: Repository<AssessmentTranslation>,
        @InjectRepository(AssessmentConfiguration)
        private readonly configurationRepository: Repository<AssessmentConfiguration>,
        @InjectRepository(Courses)
        private readonly coursesRepository: Repository<Courses>,
        private readonly dataSource: DataSource,

    ) { }

    async getAllByCourse(params: GetAllByCourseParams) {
        const { courseId, search, actives, page, limit, tenantId } = params;

        // 📌 Query base
        const queryBuilder = this.assessmentRepository
            .createQueryBuilder('assessment')
            .leftJoinAndSelect('assessment.translations', 'translations')
            .leftJoinAndSelect('assessment.configuration', 'configuration')
            .where('assessment.tenantId = :tenantId', { tenantId })
            .andWhere('assessment.courseId = :courseId', { courseId });

        // 📌 Filtro de activos
        if (actives !== undefined) {
            queryBuilder.andWhere('assessment.isActive = :isActive', { isActive: actives });
        }

        // 📌 Búsqueda por título/descripción en traducciones
        if (search && search.trim() !== '') {
            queryBuilder.andWhere(
                '(translations.title ILIKE :search OR translations.description ILIKE :search OR assessment.slug ILIKE :search)',
                { search: `%${search.trim()}%` }
            );
        }

        // 📌 Ordenar por order y fecha de creación
        queryBuilder
            .orderBy('assessment.order', 'ASC')
            .addOrderBy('assessment.created_at', 'DESC');

        // 📌 Contar total antes de paginar
        const total = await queryBuilder.getCount();

        // 📌 Aplicar paginación
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // 📌 Obtener resultados
        const assessments = await queryBuilder.getMany();

        // 📌 Calcular stats
        const statsQuery = this.assessmentRepository
            .createQueryBuilder('assessment')
            .where('assessment.tenantId = :tenantId', { tenantId })
            .andWhere('assessment.courseId = :courseId', { courseId });

        const [
            totalActive,
            totalDraft,
            totalPublished,
            totalArchived
        ] = await Promise.all([
            statsQuery.clone().andWhere('assessment.isActive = true').getCount(),
            statsQuery.clone().andWhere('assessment.status = :status', { status: AssessmentStatus.DRAFT }).getCount(),
            statsQuery.clone().andWhere('assessment.status = :status', { status: AssessmentStatus.PUBLISHED }).getCount(),
            statsQuery.clone().andWhere('assessment.status = :status', { status: AssessmentStatus.ARCHIVED }).getCount(),
        ]);

        // 📌 Construir respuesta
        return {
            data: assessments,
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


    async getById(id: string, tenantId: string): Promise<Assessment> {
        try {
            const assessment = await this.assessmentRepository
            .createQueryBuilder('assessment')
            .leftJoinAndSelect(
                'assessment.translations',
                'translations',
                'translations.languageCode = :lang',
                { lang: 'es' }
            )
            .leftJoinAndSelect('assessment.configuration', 'configuration')
            .leftJoinAndSelect('assessment.questions', 'questions')
            .leftJoinAndSelect('questions.options', 'options')
            .leftJoinAndSelect(
                'questions.translations',
                'questionTranslations',
                'questionTranslations.languageCode = :lang',
                { lang: 'es' }
            )
            // .leftJoinAndSelect('attempts', 'attempts', 'attempts.assessmentId = assessment.id')
            .where('assessment.id = :id', { id })
            .andWhere('assessment.tenantId = :tenantId', { tenantId })
            .orderBy('questions.order', 'ASC')
            .addOrderBy('options.order', 'ASC')
            .getOne();

            if (!assessment) {
                throw new NotFoundException('Assessment not found');
            }

            return assessment;

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching assessment');
        }
    }

    async create(params: CreateAssessmentParams): Promise<Assessment> {
        const { tenantId, courseId, translations, configuration, ...assessmentData } = params;

        // 📌 Validar que el curso existe y pertenece al tenant
        const course = await this.coursesRepository.findOne({
            where: { id: courseId, tenantId },
        });

        if (!course) {
            throw new NotFoundException('Curso no encontrado');
        }

        // 📌 Generar slug único
        const baseSlug = this.generateSlug(translations[0].title);
        const slug = await this.generateUniqueSlug(baseSlug, tenantId);

        // 📌 Obtener el siguiente order si no se proporciona
        let order = assessmentData.order;
        if (order === undefined) {
            const lastAssessment = await this.assessmentRepository.findOne({
                where: { courseId, tenantId },
                order: { order: 'DESC' },
            });
            order = lastAssessment ? lastAssessment.order + 1 : 0;
        }

        // 📌 Usar transacción para crear todo junto
        const result = await this.dataSource.transaction(async (manager) => {
            // Crear assessment
            const assessment = manager.create(Assessment, {
                slug,
                tenantId,
                courseId,
                type: assessmentData.type || AssessmentType.EVALUATION,
                status: assessmentData.status || AssessmentStatus.DRAFT,
                isActive: assessmentData.isActive !== undefined ? assessmentData.isActive : true,
                order,
                configuration: {
                    isGradable: configuration?.isGradable !== undefined ? configuration.isGradable : true,
                    gradingMethod: configuration?.gradingMethod || GradingMethod.AUTOMATIC,
                    passingScore: configuration?.passingScore || 70,
                    maxScore: configuration?.maxScore || 100,
                    generatesCertificate: configuration?.generatesCertificate || false,
                    certificateTemplateId: configuration?.certificateTemplateId || null,
                    requirePassingScoreForCertificate: configuration?.requirePassingScoreForCertificate || false,
                    hasAdditionalQuestions: configuration?.hasAdditionalQuestions || false,
                    additionalQuestionsPosition: configuration?.additionalQuestionsPosition || null,
                    additionalQuestionsInstructions: configuration?.additionalQuestionsInstructions || null,
                    maxAttempts: configuration?.maxAttempts || 1,
                    allowReview: configuration?.allowReview !== undefined ? configuration.allowReview : true,
                    showCorrectAnswers: configuration?.showCorrectAnswers || false,
                    showScoreImmediately: configuration?.showScoreImmediately || false,
                    timeBetweenAttempts: configuration?.timeBetweenAttempts || null,
                    timeLimit: configuration?.timeLimit || null,
                    strictTimeLimit: configuration?.strictTimeLimit || false,
                    questionOrderMode: configuration?.questionOrderMode || QuestionOrderMode.FIXED,
                    randomizeOptions: configuration?.randomizeOptions || false,
                    oneQuestionPerPage: configuration?.oneQuestionPerPage || false,
                    allowNavigationBetweenQuestions: configuration?.allowNavigationBetweenQuestions !== undefined ?
                        configuration.allowNavigationBetweenQuestions : true,
                    availableFrom: configuration?.availableFrom ? new Date(configuration.availableFrom) : null,
                    availableUntil: configuration?.availableUntil ? new Date(configuration.availableUntil) : null,
                    gradeReleaseDate: configuration?.gradeReleaseDate ? new Date(configuration.gradeReleaseDate) : null,
                    requirePassword: configuration?.requirePassword || false,
                    accessPassword: configuration?.accessPassword || null,
                    requireProctoring: configuration?.requireProctoring || false,
                    preventTabSwitching: configuration?.preventTabSwitching || false,
                    fullscreenMode: configuration?.fullscreenMode || false,
                    showFeedbackAfterQuestion: configuration?.showFeedbackAfterQuestion !== undefined ?
                        configuration.showFeedbackAfterQuestion : true,
                    showFeedbackAfterCompletion: configuration?.showFeedbackAfterCompletion !== undefined ?
                        configuration.showFeedbackAfterCompletion : true,
                    customPassMessage: configuration?.customPassMessage || null,
                    customFailMessage: configuration?.customFailMessage || null,
                    notifyInstructorOnCompletion: configuration?.notifyInstructorOnCompletion || false,
                    notifyInstructorOnNewAttempt: configuration?.notifyInstructorOnNewAttempt || false,
                    metadata: configuration?.metadata || {},
                }
            });

            const savedAssessment = await manager.save(Assessment, assessment);

            // Crear traducciones
            const translationEntities = translations.map(t =>
                manager.create(AssessmentTranslation, {
                    ...t,
                    assessment: savedAssessment, // 📌 Relación en lugar de assessmentId
                })
            );
            await manager.save(AssessmentTranslation, translationEntities);

            // Retornar con relaciones
            const finalAssessment = await manager.findOne(Assessment, {
                where: { id: savedAssessment.id },
                relations: ['translations', 'configuration'],
            });

            if (!finalAssessment) {
                throw new BadRequestException('Error al crear la evaluación');
            }

            return finalAssessment;
        });

        return result;
    }

    // 📌 Helper para generar slug
    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
            .trim()
            .replace(/\s+/g, '-') // Espacios a guiones
            .replace(/-+/g, '-'); // Múltiples guiones a uno
    }

    // 📌 Helper para generar slug único
    private async generateUniqueSlug(baseSlug: string, tenantId: string): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (await this.assessmentRepository.findOne({ where: { slug, tenantId } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }


    async update(id: string, params: Partial<UpdateAssessmentParams>): Promise<Assessment> {
        const { tenantId, translations, configuration, ...assessmentData } = params;

        console.log('Updating assessment with data:', params);

        // Buscar assessment existente
        const existingAssessment = await this.assessmentRepository.findOne({
            where: { id, tenantId },
            relations: ['translations', 'configuration'],
        });

        if (!existingAssessment) {
            throw new NotFoundException('Assessment no encontrado');
        }

        // Si se actualiza el courseId, validar que existe
        if (assessmentData.courseId && assessmentData.courseId !== existingAssessment.courseId) {
            const course = await this.coursesRepository.findOne({
                where: { id: assessmentData.courseId, tenantId },
            });

            if (!course) {
                throw new NotFoundException('Curso no encontrado');
            }
        }

        // Usar transacción para actualizar todo
        const result = await this.dataSource.transaction(async (manager) => {
            // Actualizar assessment
            if (Object.keys(assessmentData).length > 0) {
                await manager.update(Assessment, id, assessmentData);
            }

            // Actualizar configuration si se proporciona
            if (configuration && existingAssessment.configuration) {
                await manager.update(
                    AssessmentConfiguration,
                    existingAssessment.configuration.id,
                    configuration
                );
            }

            // Actualizar traducciones si se proporcionan
            if (translations && translations.length > 0) {
                for (const translationDto of translations) {
                    const existingTranslation = existingAssessment.translations.find(
                        t => t.languageCode === translationDto.languageCode
                    );

                    if (existingTranslation) {
                        // Actualizar traducción existente
                        await manager.update(
                            AssessmentTranslation,
                            existingTranslation.id,
                            translationDto
                        );
                    } else {
                        // Crear nueva traducción
                        const newTranslation = manager.create(AssessmentTranslation, {
                            ...translationDto,
                            assessmentId: id,
                        });
                        await manager.save(AssessmentTranslation, newTranslation);
                    }
                }
            }

            // Retornar assessment actualizado
            const updatedAssessment = await manager.findOne(Assessment, {
                where: { id },
                relations: ['translations', 'configuration'],
            });

            if (!updatedAssessment) {
                throw new BadRequestException('Error al actualizar la evaluación');
            }

            return updatedAssessment;
        });

        return result;
    }

    /**
     * Obtiene una evaluación con todas sus preguntas y opciones
     * para que el estudiante pueda realizarla
     */
    // async getByIdWithQuestions(
    //     id: string,
    //     tenantId: string,
    // ): Promise<Assessment> {
    //     const assessment = await this.assessmentRepository.findOne({
    //         where: {
    //             id,
    //             tenantId,
    //             isActive: true,
    //         },
    //         relations: [
    //             'configuration',
    //             'translations',
    //             'questions',
    //             'questions.translations',
    //             'questions.options',
    //             'questions.options.translations',
    //         ],
    //         order: {
    //             questions: {
    //                 order: 'ASC',
    //                 options: {
    //                     order: 'ASC',
    //                 },
    //             },
    //         },
    //     });

    //     if (!assessment) {
    //         throw new NotFoundException('Evaluación no encontrada');
    //     }

    //     // Validar que la evaluación esté publicada
    //     if (assessment.status !== 'published') {
    //         throw new BadRequestException('Esta evaluación no está disponible');
    //     }

    //     // Validar fechas de disponibilidad si existen
    //     if (assessment.configuration) {
    //         const now = new Date();

    //         if (
    //             assessment.configuration.availableFrom &&
    //             now < assessment.configuration.availableFrom
    //         ) {
    //             throw new BadRequestException('Esta evaluación aún no está disponible');
    //         }

    //         if (
    //             assessment.configuration.availableUntil &&
    //             now > assessment.configuration.availableUntil
    //         ) {
    //             throw new BadRequestException('Esta evaluación ya no está disponible');
    //         }
    //     }

    //     // Remover las respuestas correctas de las opciones (seguridad)
    //     if (assessment.questions) {
    //         assessment.questions.forEach(question => {
    //             if (question.options) {
    //                 question.options.forEach(option => {
    //                     // Solo mantener isCorrect para validación posterior, 
    //                     // pero no enviar al frontend
    //                     delete option.isCorrect;
    //                 });
    //             }
    //         });
    //     }

    //     return assessment;
    // }

    /**
 * Obtiene evaluación para estudiantes - SIN respuestas correctas
 */
    async getByIdWithQuestions(
        id: string,
        tenantId: string,
    ): Promise<any> {
        const assessment = await this.assessmentRepository.findOne({
            where: {
                id,
                tenantId,
                isActive: true,
            },
            relations: [
                'configuration',
                'translations',
                'questions',
                'questions.translations',
                'questions.options',
                'questions.options.translations',
            ],
            order: {
                questions: {
                    order: 'ASC',
                    options: {
                        order: 'ASC',
                    },
                },
            },
        });

        if (!assessment) {
            throw new NotFoundException('Evaluación no encontrada');
        }

        if (assessment.status !== 'published') {
            throw new BadRequestException('Esta evaluación no está disponible');
        }

        // Validar disponibilidad
        if (assessment.configuration) {
            const now = new Date();

            if (
                assessment.configuration.availableFrom &&
                now < assessment.configuration.availableFrom
            ) {
                throw new BadRequestException('Esta evaluación aún no está disponible');
            }

            if (
                assessment.configuration.availableUntil &&
                now > assessment.configuration.availableUntil
            ) {
                throw new BadRequestException('Esta evaluación ya no está disponible');
            }
        }

        // Transformar para remover información sensible
        return {
            id: assessment.id,
            slug: assessment.slug,
            type: assessment.type,
            status: assessment.status,
            translations: assessment.translations,
            configuration: {
                ...assessment.configuration,
                // Remover información sensible
                accessPassword: undefined,
            },
            questions: assessment.questions.map(question => ({
                id: question.id,
                type: question.type,
                order: question.order,
                points: question.points,
                isRequired: question.isRequired,
                difficulty: question.difficulty,
                caseSensitive: question.caseSensitive,
                minLength: question.minLength,
                maxLength: question.maxLength,
                scaleMin: question.scaleMin,
                scaleMax: question.scaleMax,
                scaleStep: question.scaleStep,
                translations: question.translations,
                options: question.options.map(option => ({
                    id: option.id,
                    order: option.order,
                    translations: option.translations,
                    // NO incluir isCorrect, partialCreditPercentage
                })),
            })),
        };
    }

    /**
     * Versión alternativa que SÍ incluye las respuestas correctas
     * (solo para administradores/instructores)
     */
    async getByIdWithQuestionsAdmin(
        id: string,
        tenantId: string,
    ): Promise<Assessment> {
        const assessment = await this.assessmentRepository.findOne({
            where: {
                id,
                tenantId,
            },
            relations: [
                'configuration',
                'translations',
                'questions',
                'questions.translations',
                'questions.options',
                'questions.options.translations',
            ],
            order: {
                questions: {
                    order: 'ASC',
                    options: {
                        order: 'ASC',
                    },
                },
            },
        });

        if (!assessment) {
            throw new NotFoundException('Evaluación no encontrada');
        }

        return assessment;
    }
}
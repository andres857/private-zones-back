// courses.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Courses } from './entities/courses.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { TenantsService } from 'src/tenants/tenants.service';
import { CourseTranslation } from './entities/courses-translations.entity';
import { CourseTranslationDto } from './dto/course-translation.dto';
import { ModuleItem, ModuleItemType } from './entities/courses-modules-item.entity';
import { ContentItem } from '../contents/entities/courses-contents.entity';
import { Forum } from '../forums/entities/forum.entity';
import { Task } from './entities/courses-tasks.entity';
import { Quiz } from './entities/courses-quizzes.entity';
import { Survey } from './entities/courses-surveys.entity';
import { UserCourseProgress, CourseStatus } from 'src/progress/entities/user-course-progress.entity';
import { UserModuleProgress, ModuleStatus } from 'src/progress/entities/user-module-progress.entity';
import { UserItemProgress, ItemStatus } from 'src/progress/entities/user-item-progress.entity';
import { CourseModule } from './entities/courses-modules.entity';
import { FindAllCoursesParams, PaginatedCoursesResponse } from './interfaces/courses.interface';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Courses)
        private readonly courseRepository: Repository<Courses>,

        private readonly tenantsService: TenantsService,

        @InjectRepository(ContentItem)
        private readonly contentRepository: Repository<ContentItem>,
        @InjectRepository(Forum)
        private readonly forumRepository: Repository<Forum>,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(Quiz)
        private readonly quizRepository: Repository<Quiz>,
        @InjectRepository(Survey)
        private readonly surveyRepository: Repository<Survey>,
        @InjectRepository(ModuleItem)
        private readonly moduleItemRepository: Repository<ModuleItem>,
        @InjectRepository(CourseTranslation)
        private readonly courseTranslationRepository: Repository<CourseTranslation>,
        @InjectRepository(UserCourseProgress)
        private readonly userCourseProgressRepository: Repository<UserCourseProgress>,
        @InjectRepository(UserModuleProgress)
        private readonly userModuleProgressRepository: Repository<UserModuleProgress>,
        @InjectRepository(UserItemProgress)
        private readonly userItemProgressRepository: Repository<UserItemProgress>,
    ) { }

    async findByTenant(tenantDomain: string): Promise<Courses[]> {
        try {
            const tenantId = await this.tenantsService.getTenantIdByDomain(tenantDomain);

            console.log(`Buscando cursos para el tenant con ID: ${tenantId}`);

            if (!tenantId) {
                throw new BadRequestException('Tenant not found for the provided domain');
            }

            return await this.courseRepository.find({
                where: { tenantId },
                relations: ['translations', 'sections'],
            });
        } catch (error) {
            console.error('Error al buscar cursos por tenant:', error);
            throw new BadRequestException('Error al buscar cursos por tenant');
        }
    }

    /**
     * Verifica si una fecha es válida para PostgreSQL
     */
    private isValidDate(dateString: string): boolean {
        // Rechazar explícitamente las fechas "0000-00-00"
        if (dateString === '0000-00-00' || dateString.startsWith('0000-00-00')) {
            return false;
        }

        // Verificar si la fecha es válida
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    /**
     * Crea un nuevo curso
     */
    async create(createCourseDto: CreateCourseDto): Promise<Courses> {
        try {
            console.log('DTO recibido:', createCourseDto);

            // Crear nueva instancia del curso
            const course = new Courses();

            // Generar slug único
            course.slug = await this.generateUniqueSlug(createCourseDto, createCourseDto.tenantId);
            console.log('Slug generado:', course.slug);

            createCourseDto.slug = course.slug;

            // Preparar datos del curso (sin traducciones)
            const courseData = this.prepareCourseData(createCourseDto);

            // Asignar propiedades al curso
            Object.assign(course, courseData);

            // Procesar y crear traducciones
            if (createCourseDto.translations) {
                course.translations = await this.createTranslations(createCourseDto.translations);
            }

            console.log('Objeto Course preparado:', course);

            // Guardar el curso con sus traducciones
            return await this.courseRepository.save(course);

        } catch (error) {
            console.error('Error completo:', error);
            throw new BadRequestException(`Error al crear el curso: ${error.message}`);
        }
    }

    private prepareCourseData(createCourseDto: CreateCourseDto): any {
        const { translations, ...courseData } = createCourseDto;

        // Procesar fechas
        const processedData: any = { ...courseData };

        // Fechas de auditoría
        if (courseData.created_at && this.isValidDate(courseData.created_at)) {
            processedData.created_at = new Date(courseData.created_at);
        }

        if (courseData.updated_at && this.isValidDate(courseData.updated_at)) {
            processedData.updated_at = new Date(courseData.updated_at);
        }

        if (courseData.deleted_at && this.isValidDate(courseData.deleted_at)) {
            processedData.deleted_at = new Date(courseData.deleted_at);
        }

        // Fechas de configuración del curso
        if (courseData.startDate && this.isValidDate(courseData.startDate)) {
            processedData.startDate = new Date(courseData.startDate);
        }

        if (courseData.endDate && this.isValidDate(courseData.endDate)) {
            processedData.endDate = new Date(courseData.endDate);
        }

        if (courseData.enrollmentStartDate && this.isValidDate(courseData.enrollmentStartDate)) {
            processedData.enrollmentStartDate = new Date(courseData.enrollmentStartDate);
        }

        if (courseData.enrollmentEndDate && this.isValidDate(courseData.enrollmentEndDate)) {
            processedData.enrollmentEndDate = new Date(courseData.enrollmentEndDate);
        }

        return processedData;
    }

    // Método auxiliar para validar códigos de idioma
    private isValidLanguageCode(code: string): boolean {
        const validLanguageCodes = [
            'es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
            'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi', 'he',
            'pt-BR', 'en-US', 'en-GB', 'es-MX', 'fr-CA' // Incluir variantes regionales si las necesitas
        ];

        return validLanguageCodes.includes(code);
    }

    private async createTranslations(
        translationsData: Record<string, any>
    ): Promise<CourseTranslation[]> {
        const translations: CourseTranslation[] = [];

        for (const [languageCode, translationData] of Object.entries(translationsData)) {
            try {
                const translation = new CourseTranslation();

                translation.languageCode = languageCode;
                translation.title = translationData.title;
                translation.description = translationData.description ?? null;

                // Procesar metadata con valores por defecto
                translation.metadata = {
                    tags: translationData.metadata?.tags || [],
                    keywords: translationData.metadata?.keywords || [],
                    customFields: translationData.metadata?.customFields || {},
                    ...translationData.metadata
                };

                translations.push(translation);

            } catch (error) {
                console.error(`Error procesando traducción para idioma ${languageCode}:`, error);
                throw new BadRequestException(
                    `Error en la traducción del idioma '${languageCode}': ${error.message}`
                );
            }
        }

        return translations;
    }

    /**
     * Procesa datos legacy (desde clubs) y crea cursos
     */
    async createFromLegacy(legacyData: any): Promise<Courses[]> {
        try {
            const courses: Courses[] = [];

            // Si el JSON tiene formato clubs[...]
            if (legacyData.clubs && Array.isArray(legacyData.clubs)) {
                for (const clubData of legacyData.clubs) {
                    // Extraer el título de las traducciones si existe
                    let title = clubData.name;
                    if (clubData.club_translation && clubData.club_translation.length > 0) {
                        const esTranslation = clubData.club_translation.find(t => t.locale === 'es');
                        if (esTranslation) {
                            title = esTranslation.title;
                        }
                    }

                    // Crear DTO para el curso
                    const courseDto: CreateCourseDto = {
                        ...clubData,
                        title: title // Asignar el título extraído
                    };

                    // Eliminar la propiedad club_translation que ya no se usa
                    delete courseDto['club_translation'];

                    // Crear y guardar el curso
                    const course = await this.create(courseDto);
                    courses.push(course);
                }
            }

            return courses;
        } catch (error) {
            throw new BadRequestException(`Error al crear cursos desde datos legacy: ${error.message}`);
        }
    }

    /**
     * Encuentra un curso por su ID
     */
    async findOne(id: string): Promise<Courses> {
        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new NotFoundException(`Curso con ID ${id} no encontrado`);
        }

        return course;
    }

    // Método optimizado para resolver referencias agrupando por tipo
    private async resolveModuleItemReferencesOptimized(items: ModuleItem[], tenantId: string): Promise<ModuleItem[]> {
        if (!items || items.length === 0) {
            return items;
        }

        // Agrupar items por tipo y recopilar IDs
        const itemsByType = items.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {} as Record<ModuleItemType, ModuleItem[]>);

        // Crear un mapa para almacenar las entidades encontradas
        const entitiesMap = new Map<string, any>();

        // Realizar consultas agrupadas por tipo
        const queries = Object.entries(itemsByType).map(async ([type, typeItems]) => {
            const referenceIds = typeItems.map(item => item.referenceId);

            try {
                let entities: any[] = [];

                switch (type as ModuleItemType) {
                    case ModuleItemType.CONTENT:
                        entities = await this.contentRepository.find({
                            where: {
                                id: In(referenceIds),
                                tenantId
                            }, select: ['id', 'title', 'description', 'contentType', 'contentUrl', 'metadata'] // Seleccionar solo campos necesarios
                        });
                        break;

                    case ModuleItemType.FORUM:
                        entities = await this.forumRepository.find({
                            where: {
                                id: In(referenceIds),
                                tenantId
                            }, select: ['id', 'title', 'description']
                        });
                        break;

                    case ModuleItemType.TASK:
                        entities = await this.taskRepository.find({
                            where: {
                                id: In(referenceIds),
                                tenantId
                            }, select: ['id', 'title', 'description'],
                            relations: ['configuration']
                        });
                        break;

                    case ModuleItemType.QUIZ:
                        entities = await this.quizRepository.find({
                            where: {
                                id: In(referenceIds),
                                tenantId
                            }, select: ['id', 'title', 'description']
                        });
                        break;

                    case ModuleItemType.SURVEY:
                        entities = await this.surveyRepository.find({
                            where: {
                                id: In(referenceIds),
                                tenantId
                            }, select: ['id', 'title', 'description']
                        });
                        break;

                    case ModuleItemType.ACTIVITY:
                        // Si tienes una entidad Activity, agrégala aquí
                        console.warn(`Tipo ACTIVITY no implementado aún`);
                        break;

                    default:
                        console.warn(`Tipo de ModuleItem no reconocido: ${type}`);
                }

                // Agregar entidades al mapa
                entities.forEach(entity => {
                    entitiesMap.set(entity.id, entity);
                });

            } catch (error) {
                console.error(`Error al resolver referencias para tipo ${type}:`, error);
            }
        });

        // Ejecutar todas las consultas en paralelo
        await Promise.all(queries);

        // Asignar las entidades resueltas a cada item
        const resolvedItems = items.map(item => ({
            ...item,
            referencedEntity: entitiesMap.get(item.referenceId) || null
        })) as (ModuleItem & { referencedEntity: any })[];

        return resolvedItems;
    }

    async findCourseForMake(id: string, tenant: string, userId: string): Promise<Courses> {
        try {
            const tenantId = await this.tenantsService.getTenantIdByDomain(tenant);
            if (!tenantId) {
                throw new BadRequestException('Tenant not found for the provided domain');
            }

            const course = await this.courseRepository.findOne({
                where: { id, tenantId },
                relations: [
                    'translations',
                    'sections',
                    'modules',
                    'modules.configuration',
                    'modules.items',
                    'configuration',
                    'viewsConfig',
                    'userConnections',
                    'userConnections.user'
                ],
            });

            if (!course) {
                throw new NotFoundException(`Curso con ID ${id} no encontrado`);
            }

            // Filtrar módulos que tienen items y configuración activa
            if (course?.modules) {
                course.modules = course.modules.filter(module => {
                    // Verificar que tiene items
                    const hasItems = module.items && module.items.length > 0;

                    // Verificar que tiene configuración y está activa
                    const hasActiveConfig = module.configuration && module.configuration.isActive;

                    return hasItems && hasActiveConfig;
                });
            }

            // Verificar si el usuario está inscrito
            const userEnrollment = course.userConnections?.find(uc => uc.user.id === userId);
            const isEnrolled = !!userEnrollment;

            // Obtener progreso del usuario si está inscrito
            let userCourseProgress: UserCourseProgress | null = null;
            let userModuleProgressMap = new Map();
            let userItemProgressMap = new Map();

            if (isEnrolled) {
                // Obtener progreso general del curso
                userCourseProgress = await this.userCourseProgressRepository.findOne({
                    where: { userId, courseId: id }
                });

                // Obtener progreso de módulos
                const moduleIds = course.modules?.map(m => m.id) || [];
                if (moduleIds.length > 0) {
                    const moduleProgressList = await this.userModuleProgressRepository.find({
                        where: {
                            userId,
                            moduleId: In(moduleIds)
                        }
                    });

                    moduleProgressList.forEach(mp => {
                        userModuleProgressMap.set(mp.moduleId, mp);
                    });
                }

                // Obtener progreso de items
                const allItemIds: string[] = [];
                course.modules?.forEach(module => {
                    module.items?.forEach(item => {
                        allItemIds.push(item.id);
                    });
                });

                if (allItemIds.length > 0) {
                    const itemProgressList = await this.userItemProgressRepository.find({
                        where: {
                            userId,
                            itemId: In(allItemIds)
                        }
                    });

                    itemProgressList.forEach(ip => {
                        userItemProgressMap.set(ip.itemId, ip);
                    });
                }
            }

            // Recopilar todos los items de todos los módulos
            const allItems: ModuleItem[] = [];
            const itemToModuleMap = new Map<string, any>();

            // Validar que tenemos módulos con items y configuración activa
            const validModules = course.modules?.filter(module =>
                module.items &&
                module.items.length > 0 &&
                module.configuration &&
                module.configuration.isActive
            ) || [];

            if (validModules.length > 0) {
                course.modules = validModules;
                course.modules.forEach(module => {
                    if (module.items && module.items.length > 0) {
                        module.items.forEach(item => {
                            allItems.push(item);
                            itemToModuleMap.set(item.id, module);
                        });
                    }
                });
            }

            // Resolver todas las referencias de una vez
            if (allItems.length > 0) {
                const resolvedItems = await this.resolveModuleItemReferencesOptimized(allItems, tenantId);

                // Crear un mapa con los items resueltos usando su ID
                const resolvedItemsMap = new Map(resolvedItems.map(item => [item.id, item]));

                // Ordenar módulos por configuración de orden
                const sortedModules = [...course.modules].sort((a, b) => {
                    const orderA = a.configuration?.order || 0;
                    const orderB = b.configuration?.order || 0;
                    return orderA - orderB;
                });

                // Encontrar el item activo (primer item no completado)
                let activeItemId: string | null = null;
                if (isEnrolled) {
                    for (const module of sortedModules) {
                        if (module.items && module.items.length > 0) {
                            const sortedItems = [...module.items].sort((a, b) => (a.order || 0) - (b.order || 0));
                            for (const item of sortedItems) {
                                const itemProgress = userItemProgressMap.get(item.id);
                                if (!itemProgress?.isCompleted()) {
                                    activeItemId = item.id;
                                    break;
                                }
                            }
                            if (activeItemId) break;
                        }
                    }
                }

                course.modules = sortedModules.map(module => {
                    if (module.items && module.items.length > 0) {
                        // Ordenar items por orden
                        const sortedItems = [...module.items].sort((a, b) => (a.order || 0) - (b.order || 0));

                        // Crear los items con la estructura personalizada
                        const transformedItems = sortedItems.map((item, index) => {
                            const resolvedItem = resolvedItemsMap.get(item.id) as (ModuleItem & { referencedEntity: any }) | undefined; // El ModuleItem con referencedEntity
                            const referencedEntity = resolvedItem?.referencedEntity; // La entidad real (ContentItem, Forum, Quiz, etc.)
                            const itemProgress = userItemProgressMap.get(item.id);

                            // Determinar si el item está bloqueado
                            let isLocked = false;
                            if (isEnrolled) {
                                // Si no es el primer item, verificar items anteriores
                                if (index > 0) {
                                    const previousItems = sortedItems.slice(0, index);
                                    isLocked = previousItems.some(prevItem => {
                                        const prevProgress = userItemProgressMap.get(prevItem.id);
                                        return !prevProgress?.isCompleted();
                                    });
                                }

                                // También verificar si módulos anteriores están completados según approvalPercentage
                                const moduleConfig = module.configuration;
                                if (moduleConfig && index === 0) {
                                    const currentModuleIndex = sortedModules.findIndex(m => m.id === module.id);
                                    if (currentModuleIndex > 0) {
                                        const previousModules = sortedModules.slice(0, currentModuleIndex);
                                        isLocked = previousModules.some(prevModule => {
                                            const moduleProgress = userModuleProgressMap.get(prevModule.id);
                                            const approvalPercentage = prevModule.configuration?.approvalPercentage || 80;
                                            return !moduleProgress || (moduleProgress.progressPercentage || 0) < approvalPercentage;
                                        });
                                    }
                                }
                            }

                            // console.log('itemmmm:', referencedEntity);
                            // console.log('itemmmm2:', item);


                            // Los datos reales vienen de la entidad referenciada
                            const itemData = {
                                id: item.id, // ID del ModuleItem
                                type: item.type, // Tipo del ModuleItem (content, quiz, task, etc.)
                                referenceId: item.referenceId, // ID de la entidad real
                                order: item.order || index + 1, // Orden del ModuleItem
                                // Datos que vienen de la entidad referenciada
                                title: referencedEntity?.title || 'Sin título',
                                description: referencedEntity?.description || null,
                                duration: this.calculateItemDuration(item, referencedEntity),
                                thumbnailImagePath: referencedEntity?.thumbnailImagePath || null,
                                // Estados de progreso
                                isCompleted: isEnrolled ? (itemProgress?.isCompleted() || false) : false,
                                isLocked: isEnrolled ? isLocked : true,
                                ...(activeItemId === item.id && { isActive: true }),
                                // Datos específicos según el tipo
                                ...(item.type === 'content' && referencedEntity && {
                                    contentType: referencedEntity.contentType,
                                    contentUrl: referencedEntity.contentUrl
                                }),
                                ...(item.type === 'forum' && referencedEntity && {
                                    discution: referencedEntity.discution,
                                    startDate: referencedEntity.startDate,
                                    endDate: referencedEntity.endDate
                                }),
                                ...(item.type === 'task' && referencedEntity && {
                                    startDate: referencedEntity.startDate,
                                    endDate: referencedEntity.endDate,
                                    configuration: referencedEntity.configuration
                                })
                            };

                            return itemData;
                        });

                        // Asignar los items transformados usando any para evitar problemas de tipo
                        (module as any).items = transformedItems;

                        // Agregar estadísticas del módulo usando el helper
                        this.addModuleStats(module, userItemProgressMap, isEnrolled);
                    } else {
                        // Si no hay items, agregar stats usando el helper
                        this.addModuleStats(module, userItemProgressMap, isEnrolled);
                    }

                    return module;
                });
            }

            // Agregar información de inscripción al curso
            let completedModules = 0;
            const totalModules = course.modules?.length || 0;

            if (isEnrolled && course.modules) {
                course.modules.forEach(module => {
                    const moduleProgress = userModuleProgressMap.get(module.id);
                    if (moduleProgress?.isCompleted()) {
                        completedModules++;
                    }
                });
            }

            (course as any).enrollmentInfo = {
                isEnrolled,
                enrollmentDate: userEnrollment?.created_at || null,
                progress: userCourseProgress?.progressPercentage || 0,
                completedModules,
                totalModules
            };

            return course;

        } catch (error) {
            console.error('Error al encontrar curso para hacer:', error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new NotFoundException(`Curso con ID ${id} no encontrado`);
        }
    }

    /**
     * Encuentra todos los cursos
     */
    /**
     * Encuentra todos los cursos con filtros y paginación
     */
    async findAll(params: FindAllCoursesParams): Promise<PaginatedCoursesResponse> {
        const {
            tenantId,
            search,
            actives,
            page = 1,
            limit = 12,
            languageCode = 'es'
        } = params;

        const queryBuilder = this.courseRepository.createQueryBuilder('courses');

        // 🏢 Filtrar por tenant (OBLIGATORIO)
        queryBuilder.where('courses.tenantId = :tenantId', { tenantId });

        // 🗑️ Excluir cursos eliminados (soft delete)
        queryBuilder.andWhere('courses.deleted_at IS NULL');

        // ✅ Filtrar por estado activo si se especifica
        if (typeof actives === 'boolean') {
            queryBuilder.andWhere('courses.isActive = :actives', { actives });
        }

        // 🔍 Búsqueda por texto en traducciones
        if (search?.trim()) {
            queryBuilder
                .leftJoin('courses.translations', 'translations')
                .andWhere(
                    '(LOWER(translations.title) LIKE LOWER(:search) OR LOWER(translations.description) LIKE LOWER(:search) OR LOWER(courses.slug) LIKE LOWER(:search))',
                    { search: `%${search.trim()}%` }
                );
        }

        // 📊 Incluir relaciones necesarias
        queryBuilder
            .leftJoinAndSelect('courses.translations', 'courseTranslations')
            .leftJoinAndSelect('courses.configuration', 'configuration')
            .leftJoinAndSelect('courses.sections', 'sections')
            .leftJoinAndSelect('courses.modules', 'modules')
            .leftJoinAndSelect('modules.items', 'moduleItems');

        // 📈 Ordenar por fecha de creación (más recientes primero)
        queryBuilder.orderBy('courses.created_at', 'DESC');

        // 📄 Calcular offset para paginación
        const offset = (page - 1) * limit;

        // 🔢 Obtener total de registros antes de aplicar paginación
        const total = await queryBuilder.getCount();

        // 📄 Aplicar paginación
        queryBuilder.skip(offset).take(limit);

        // 🎯 Ejecutar consulta
        const data = await queryBuilder.getMany();

        // 📊 Calcular total de páginas
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages
        };
    }

    /**
     * Buscar curso por slug y tenant
     */
    // async findBySlugAndTenant(slug: string, tenantId: string): Promise<Courses | null> {
    //     return this.courseRepository.findOne({
    //     where: { 
    //         slug, 
    //         tenantId,
    //         deleted_at: null 
    //     },
    //     relations: [
    //         'translations', 
    //         'configuration', 
    //         'sections', 
    //         'modules', 
    //         'modules.items'
    //     ]
    //     });
    // }


    /**
     * Elimina un curso (soft delete)
     */
    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.courseRepository.softDelete(id);
    }

    /**
     * Elimina un curso permanentemente
     */
    async hardDelete(id: string): Promise<void> {
        await this.findOne(id);
        await this.courseRepository.delete(id);
    }

    /**
     * Genera un slug único para el curso
     */
    private async generateUniqueSlug(createCourseDto: CreateCourseDto, tenantId: string): Promise<string> {
        // Obtener el título base para el slug
        const baseTitle = this.getBaseTitleForSlug(createCourseDto);

        // Generar slug base
        const baseSlug = this.createSlugFromTitle(baseTitle);

        // Verificar unicidad y obtener slug final
        const uniqueSlug = await this.ensureSlugUniqueness(baseSlug, tenantId);

        return uniqueSlug;
    }

    /**
     * Obtiene el título base para generar el slug
     * Prioriza: título principal > título en español de traducciones > primer título disponible
     */
    private getBaseTitleForSlug(createCourseDto: CreateCourseDto): string {
        // 1. Usar título principal si existe
        if (createCourseDto.title?.trim()) {
            return createCourseDto.title.trim();
        }

        // 2. Buscar en traducciones - priorizar español
        if (createCourseDto.translations) {
            // Buscar traducción en español
            const esTranslationGroup = createCourseDto.translations['es'];
            if (esTranslationGroup?.es?.title?.trim()) {
                return esTranslationGroup.es.title.trim();
            }

            // Si no hay español, buscar en otras traducciones
            for (const [langCode, translationGroup] of Object.entries(createCourseDto.translations)) {
                // Revisar cada idioma dentro del grupo
                for (const [subLang, translation] of Object.entries(translationGroup)) {
                    if (translation && typeof translation === 'object' && 'title' in translation) {
                        const title = (translation as CourseTranslationDto).title;
                        if (title?.trim()) {
                            return title.trim();
                        }
                    }
                }
            }
        } // ← Esta llave cierra el if (createCourseDto.translations)

        // 3. Fallback - usar timestamp
        return `curso-${Date.now()}`;
    }

    /**
     * Convierte un título en un slug válido
     */
    private createSlugFromTitle(title: string): string {
        return title
            .toLowerCase()
            .trim()
            // Reemplazar caracteres especiales y acentos
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
            // Reemplazar espacios y caracteres no alfanuméricos con guiones
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s_]+/g, '-') // Convertir espacios y guiones bajos a guiones
            .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
            .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
            // Limitar longitud
            .substring(0, 100);
    }

    /**
     * Asegura que el slug sea único agregando un sufijo numérico si es necesario
     */
    private async ensureSlugUniqueness(baseSlug: string, tenantId: string, excludeId?: string): Promise<string> {
        let currentSlug = baseSlug;
        let counter = 0;
        let isUnique = false;

        while (!isUnique) {
            // Construir el slug actual (con sufijo si es necesario)
            const testSlug = counter === 0 ? currentSlug : `${baseSlug}-${counter}`;

            // Verificar si existe en la base de datos
            const existingCourse = await this.courseRepository
                .createQueryBuilder('course')
                .where('course.slug = :slug', { slug: testSlug })
                .andWhere('course.tenantId = :tenantId', { tenantId })
                .andWhere('course.deleted_at IS NULL') // Excluir cursos eliminados
                .getOne();

            if (!existingCourse || (excludeId && existingCourse.id === excludeId)) {
                currentSlug = testSlug;
                isUnique = true;
            } else {
                counter++;
                // Prevenir bucle infinito
                if (counter > 9999) {
                    currentSlug = `${baseSlug}-${Date.now()}`;
                    isUnique = true;
                }
            }
        }

        return currentSlug;
    }

    /**
     * Valida que un slug tenga el formato correcto
     */
    private validateSlugFormat(slug: string): boolean {
        // El slug debe tener entre 3 y 100 caracteres
        if (slug.length < 3 || slug.length > 100) {
            return false;
        }

        // Solo debe contener letras minúsculas, números y guiones
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(slug);
    }

    /**
     * Método público para generar slug desde título (útil para APIs)
     */
    async generateSlugFromTitle(title: string, tenantId: string): Promise<string> {
        const baseSlug = this.createSlugFromTitle(title);
        return await this.ensureSlugUniqueness(baseSlug, tenantId);
    }

    /**
     * Método para regenerar slug de un curso existente
     */
    async regenerateSlug(courseId: string, newTitle?: string): Promise<string> {
        const course = await this.courseRepository.findOne({
            where: { id: courseId },
            relations: ['translations']
        });

        if (!course) {
            throw new BadRequestException('Curso no encontrado');
        }

        // Usar nuevo título o el título de la traducción principal
        const titleToUse = newTitle || course.getTranslatedTitle('es') || course.slug;
        const baseSlug = this.createSlugFromTitle(titleToUse);
        const newSlug = await this.ensureSlugUniqueness(baseSlug, course.tenantId, courseId);

        // Actualizar el curso con el nuevo slug
        await this.courseRepository.update(courseId, { slug: newSlug });

        return newSlug;
    }




    // Método helper para calcular la duración de un item según su tipo
    private calculateItemDuration(item: any, referencedEntity: any): number {
        let duration = 0;

        switch (item.type) {
            case ModuleItemType.CONTENT:
                if (referencedEntity?.metadata?.duration) {
                    duration = referencedEntity.metadata.duration;
                } else if (referencedEntity?.metadata?.videoDuration) {
                    duration = referencedEntity.metadata.videoDuration;
                } else if (referencedEntity?.metadata?.estimatedReadingTime) {
                    duration = referencedEntity.metadata.estimatedReadingTime * 60; // convertir minutos a segundos
                } else {
                    // Duración por defecto según tipo de contenido
                    switch (referencedEntity?.contentType) {
                        case 'video':
                            duration = 600; // 10 minutos por defecto para videos
                            break;
                        case 'document':
                            duration = 300; // 5 minutos por defecto para documentos
                            break;
                        default:
                            duration = 180; // 3 minutos por defecto
                    }
                }
                break;

            case ModuleItemType.QUIZ:
                // Para quizzes, estimar tiempo basado en número de preguntas
                if (item.resolvedContent?.questions) {
                    const questionsCount = item.resolvedContent.questions.length;
                    duration = questionsCount * 60; // 1 minuto por pregunta estimado
                } else {
                    duration = 300; // 5 minutos por defecto para quizzes
                }
                break;

            case ModuleItemType.TASK:
                // Para tareas, usar duración estimada o valor por defecto
                duration = item.resolvedContent?.estimatedDuration || 1800; // 30 minutos por defecto
                break;

            case ModuleItemType.SURVEY:
                // Para encuestas, estimar basado en número de preguntas
                if (item.resolvedContent?.questions) {
                    const questionsCount = item.resolvedContent.questions.length;
                    duration = questionsCount * 30; // 30 segundos por pregunta
                } else {
                    duration = 300; // 5 minutos por defecto
                }
                break;

            case ModuleItemType.FORUM:
                // Para foros, tiempo mínimo estimado
                duration = 600; // 10 minutos por defecto
                break;

            case ModuleItemType.ACTIVITY:
                // Para actividades, usar duración específica o estimar
                duration = item.resolvedContent?.estimatedDuration || 900; // 15 minutos por defecto
                break;

            default:
                duration = 300; // 5 minutos por defecto para tipos no reconocidos
        }

        return Math.round(duration / 60);
    }

    // Método actualizado para usar el helper de duración
    private addModuleStats(module: CourseModule, userItemProgressMap: Map<string, UserItemProgress>, isEnrolled: boolean): void {
        const totalItems = module.items?.length || 0;
        let completedItems = 0;
        let totalDuration = 0;

        if (module.items) {
            module.items.forEach(item => {
                // Calcular duración usando el helper
                // totalDuration += this.calculateItemDuration(item);

                // Verificar si está completado (solo si el usuario está inscrito)
                if (isEnrolled) {
                    const itemProgress = userItemProgressMap.get(item.id);
                    if (itemProgress?.isCompleted()) {
                        completedItems++;
                    }
                }
            });
        }

        // Agregar stats al módulo
        (module as any).stats = {
            totalItems,
            completedItems: isEnrolled ? completedItems : 0,
            totalDuration
        };
    }


    async getUserProgress(courseId: string, userId: string) {
        // 1. Verificar que el curso existe
        const course = await this.courseRepository.findOne({
            where: { id: courseId },
            relations: ['modules', 'modules.items', 'modules.configuration']
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // 2. Obtener progreso general del curso
        let courseProgress = await this.userCourseProgressRepository.findOne({
            where: { courseId, userId }
        });

        // Si no existe progreso, crear uno nuevo
        if (!courseProgress) {
            courseProgress = this.userCourseProgressRepository.create({
                courseId,
                userId,
                status: CourseStatus.NOT_STARTED,
                progressPercentage: 0,
                totalTimeSpent: 0,
                totalModulesCompleted: 0,
                totalModules: course.modules?.length || 0,
                totalItemsCompleted: 0,
                totalItems: course.getAllItems().length || 0,
            });
            await this.userCourseProgressRepository.save(courseProgress);
        }

        // 3. Obtener items completados
        const completedItems = await this.userItemProgressRepository.find({
            where: {
                userId,
                status: ItemStatus.COMPLETED
            },
            relations: ['item', 'item.module'],
            select: ['itemId', 'completed_at']
        });

        // Filtrar solo los items de este curso
        const courseItemIds = course.getAllItems().map(item => item.id);
        const completedCourseItems = completedItems
            .filter(progress => courseItemIds.includes(progress.itemId))
            .map(progress => progress.itemId);

        // 4. Obtener el item actual (último accedido)
        const lastAccessedItem = await this.userItemProgressRepository.findOne({
            where: { userId },
            relations: ['item', 'item.module'],
            order: { lastAccessedAt: 'DESC' }
        });

        let currentItemId: string | null = null;
        let currentModuleId: string | null = null;
        let nextRecommendedItem: any = null;

        // Filtrar módulos activos con items y ordenarlos
        const activeModules = course.modules
            ?.filter(module =>
                module.items &&
                module.items.length > 0 &&
                module.configuration &&
                module.configuration.isActive
            )
            .sort((a, b) => (a.configuration?.order || 0) - (b.configuration?.order || 0)) || [];

        // Buscar el primer item no completado
        outerLoop: for (const module of activeModules) {
            const sortedItems = module.items
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            for (const item of sortedItems) {
                if (!completedCourseItems.includes(item.id)) {
                    // Necesitamos resolver la referencia para obtener el título
                    let itemTitle = 'Sin título';

                    try {
                        // Resolver la referencia del item para obtener el título
                        const resolvedItems = await this.resolveModuleItemReferencesOptimized([item], course.tenantId);
                        const resolvedItem = resolvedItems[0] as (ModuleItem & { referencedEntity: any }) | undefined;
                        itemTitle = resolvedItem?.referencedEntity?.title || 'Sin título';
                    } catch (error) {
                        console.warn('Error resolving item reference:', error);
                    }

                    nextRecommendedItem = {
                        moduleId: module.id,
                        itemId: item.id,
                        type: item.type,
                        referenceId: item.referenceId,
                        title: itemTitle,
                        moduleTitle: module.title
                    };
                    break outerLoop;
                }
            }
        }

        if (lastAccessedItem && courseItemIds.includes(lastAccessedItem.itemId)) {
            currentItemId = lastAccessedItem.itemId;
            currentModuleId = lastAccessedItem.item.moduleId;
        } else {
            // Si no hay último acceso, usar el primer item del curso
            const firstModule = course.modules?.[0];
            if (firstModule?.items?.[0]) {
                currentModuleId = firstModule.id;
                currentItemId = firstModule.items[0].id;
            }
        }

        // 5. Calcular tiempo total gastado en este curso
        const allItemsProgress = await this.userItemProgressRepository.find({
            where: {
                userId,
                itemId: courseItemIds.length > 0 ? In(courseItemIds) : undefined
            },
            select: ['timeSpent']
        });

        const totalTimeSpent = allItemsProgress.reduce((total, item) => total + (item.timeSpent || 0), 0);

        // 6. Calcular progreso general
        const totalItems = course.getAllItems().length;
        const overallProgress = totalItems > 0 ? Math.round((completedCourseItems.length / totalItems) * 100) : 0;

        // 7. Actualizar progreso del curso
        courseProgress.progressPercentage = overallProgress;
        courseProgress.totalItemsCompleted = completedCourseItems.length;
        courseProgress.totalTimeSpent = totalTimeSpent;
        courseProgress.lastAccessedAt = new Date();

        if (overallProgress === 100 && courseProgress.status !== CourseStatus.COMPLETED) {
            courseProgress.status = CourseStatus.COMPLETED;
            courseProgress.completed_at = new Date();
        } else if (overallProgress > 0 && courseProgress.status === CourseStatus.NOT_STARTED) {
            courseProgress.status = CourseStatus.IN_PROGRESS;
            courseProgress.started_at = new Date();
        }

        await this.userCourseProgressRepository.save(courseProgress);

        // 7.1. NUEVA LÓGICA: Actualizar progreso de módulos
        const allItemsProgressWithDetails = await this.userItemProgressRepository.find({
            where: {
                userId,
                itemId: courseItemIds.length > 0 ? In(courseItemIds) : undefined
            },
            relations: ['item'],
            select: ['itemId', 'timeSpent', 'status', 'lastAccessedAt']
        });

        let totalModulesCompleted = 0;

        for (const module of course.modules || []) {
            // Obtener items del módulo actual
            const moduleItemIds = module.items?.map(item => item.id) || [];
            const moduleCompletedItems = completedCourseItems.filter(itemId =>
                moduleItemIds.includes(itemId)
            );

            // Calcular tiempo gastado en el módulo
            const moduleItemsProgress = allItemsProgressWithDetails.filter(progress =>
                moduleItemIds.includes(progress.itemId)
            );
            const moduleTimeSpent = moduleItemsProgress.reduce((total, item) =>
                total + (item.timeSpent || 0), 0
            );

            // Calcular progreso del módulo
            const totalModuleItems = moduleItemIds.length;
            const moduleProgressPercentage = totalModuleItems > 0
                ? Math.round((moduleCompletedItems.length / totalModuleItems) * 100)
                : 0;

            // Determinar estado del módulo
            let moduleStatus = ModuleStatus.NOT_STARTED;
            let completed_at: Date | null = null;

            if (moduleProgressPercentage === 100) {
                moduleStatus = ModuleStatus.COMPLETED;
                totalModulesCompleted++;
                // Solo buscar fecha de completado si tenemos items completados
                if (moduleCompletedItems.length > 0) {
                    const moduleCompletedItemsWithDate = completedItems.filter(item =>
                        moduleItemIds.includes(item.itemId)
                    );
                    if (moduleCompletedItemsWithDate.length > 0) {
                        completed_at = new Date(Math.max(...moduleCompletedItemsWithDate.map(item =>
                            new Date(item.completed_at).getTime()
                        )));
                    }
                }
            } else if (moduleProgressPercentage > 0) {
                moduleStatus = ModuleStatus.IN_PROGRESS;
            }

            // Buscar progreso existente del módulo
            let moduleProgress = await this.userModuleProgressRepository.findOne({
                where: { userId, moduleId: module.id }
            });

            if (!moduleProgress) {
                // Crear nuevo progreso del módulo
                moduleProgress = new UserModuleProgress();
                moduleProgress.userId = userId;
                moduleProgress.moduleId = module.id;
                moduleProgress.status = moduleStatus;
                moduleProgress.progressPercentage = Number(moduleProgressPercentage);
                moduleProgress.itemsCompleted = moduleCompletedItems.length;
                moduleProgress.totalItems = totalModuleItems;
                moduleProgress.timeSpent = moduleTimeSpent;
                moduleProgress.started_at = moduleStatus !== ModuleStatus.NOT_STARTED ? new Date() : null;
                moduleProgress.completed_at = completed_at;
                moduleProgress.lastAccessedAt = new Date();
            } else {
                // Actualizar progreso existente
                moduleProgress.status = moduleStatus;
                moduleProgress.progressPercentage = Number(moduleProgressPercentage);
                moduleProgress.itemsCompleted = moduleCompletedItems.length;
                moduleProgress.totalItems = totalModuleItems;
                moduleProgress.timeSpent = moduleTimeSpent;

                // Solo actualizar started_at si no existe y el módulo está en progreso
                if (!moduleProgress.started_at && moduleStatus !== ModuleStatus.NOT_STARTED) {
                    moduleProgress.started_at = new Date();
                }

                // Actualizar completed_at si el módulo se completó
                if (moduleStatus === ModuleStatus.COMPLETED && !moduleProgress.completed_at) {
                    moduleProgress.completed_at = completed_at || new Date();
                }

                // Siempre actualizar lastAccessedAt
                moduleProgress.lastAccessedAt = new Date();
            }

            await this.userModuleProgressRepository.save(moduleProgress);
        }

        // Actualizar el contador de módulos completados en el progreso del curso
        courseProgress.totalModulesCompleted = totalModulesCompleted;
        await this.userCourseProgressRepository.save(courseProgress);

        // 8. Retornar formato requerido
        return {
            overallProgress,
            completedItems: completedCourseItems,
            lastAccessDate: courseProgress.lastAccessedAt?.toISOString() || new Date().toISOString(),
            timeSpent: totalTimeSpent,
            currentModuleId,
            currentItemId,
            nextRecommendedItem
        };
    }
}
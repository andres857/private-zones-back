import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { GetAllModulesOptions, PaginatedModuleResponse } from './interfaces/modules.interface';
import { Courses } from 'src/courses/entities/courses.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';
import { CourseModuleConfig } from 'src/courses/entities/courses-modules-config.entity';
import { ContentItem } from 'src/contents/entities/courses-contents.entity';
import { ModuleItem, ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';
import { Forum } from 'src/forums/entities/forum.entity';
import { Task } from 'src/tasks/entities/courses-tasks.entity';
import { Assessment, AssessmentType } from 'src/assessments/entities/assessment.entity';
import { Activity } from 'src/activities/entities/activity.entity';
import { ModuleWithResolvedItems } from './types/modules-response.types';
import { AddModuleItemDto } from './dto/add-module-item.dto';


export interface ResolvedModuleItem {
    id: string;
    type: ModuleItemType;
    referenceId: string;
    order: number;
    data: Record<string, any> | null; // datos del objeto referenciado
}

@Injectable()
export class ModulesService {

    constructor(
        @InjectRepository(Courses)
        private coursesRepository: Repository<Courses>,

        @InjectRepository(CourseModule)
        private courseModuleRepository: Repository<CourseModule>,

        @InjectRepository(CourseModuleConfig)
        private courseModuleConfigRepository: Repository<CourseModuleConfig>,

        @InjectRepository(ContentItem)
        private contentItemRepository: Repository<ContentItem>,

        @InjectRepository(Forum)
        private forumRepository: Repository<Forum>,

        @InjectRepository(Task)
        private taskRepository: Repository<Task>,

        @InjectRepository(Assessment)
        private assessmentRepository: Repository<Assessment>,

        @InjectRepository(Activity)
        private activityRepository: Repository<Activity>,

        @InjectRepository(ModuleItem)
        private moduleItemRepository: Repository<ModuleItem>,
    ) {}

    async getAll(options: GetAllModulesOptions): Promise<PaginatedModuleResponse>{
        const { courseId, search, page = 1, limit = 20, tenantId, actives } = options;

        const course = await this.coursesRepository.findOne({
            where: { id: courseId, tenantId },
            relations: ['modules', 'modules.items', 'modules.configuration'],
        }) as Courses;
    
        if (!course) {
            throw new Error('Course not found');
        }

        let modules = course.modules || [];

        // Filtrar módulos no eliminados (soft delete)
        modules = modules.filter(module => !module.deletedAt);

        // Filtrar por configuración no eliminada
        modules = modules.filter(module => 
            !module.configuration?.deletedAt
        );

        // Filtrar por estado activo usando la configuración
        if (actives !== undefined) {
            modules = modules.filter(module => 
                module.configuration?.isActive === actives
            );
        }

        // Filtrar por búsqueda si se proporciona
        if (search && search.trim()) {
            const searchTerm = search.toLowerCase().trim();
            modules = modules.filter(module => 
                module.title?.toLowerCase().includes(searchTerm) ||
                module.description?.toLowerCase().includes(searchTerm)
            );
        }

        // Ordenar módulos por el campo order de la configuración (ascendente), 
        // y luego por fecha de creación como fallback
        modules.sort((a, b) => {
            const orderA = a.configuration?.order ?? 999999;
            const orderB = b.configuration?.order ?? 999999;
            
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
            // Si tienen el mismo order, ordenar por fecha de creación (más recientes primero)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Calcular paginación
        const total = modules.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        
        // Aplicar paginación
        const paginatedModules = modules.slice(offset, offset + limit);

        // Construir respuesta paginada
        return {
            data: paginatedModules,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Método helper para obtener módulos activos de un curso
     */
    async getActiveModules(courseId: string, tenantId: string) {
        return this.getAll({
            courseId,
            tenantId,
            actives: true,
            userId: '', // Se podría hacer opcional en la interfaz
            page: 1,
            limit: 1000 // Obtener todos los activos
        });
    }

    async createModule(createModuleDto: CreateModuleDto) {
        try {

            if(!createModuleDto.title || createModuleDto.title.trim().length < 2) {
                throw new BadRequestException('El título del módulo es requerido y debe tener al menos 2 caracteres');
            }

            if (!createModuleDto.tenantId) {
                throw new BadRequestException('El tenantId es requerido');
            }

            console.log('Creando módulo para tenantId:', createModuleDto.tenantId);
            console.log('Datos del módulo:', createModuleDto);

            const module = new CourseModule();
            module.title = createModuleDto.title.trim();
            module.description = createModuleDto.description?.trim() || '';
            module.courseId = createModuleDto.courseId;
            module.thumbnailImagePath = createModuleDto.thumbnailImagePath?.trim() || '';

            const savedModule = await this.courseModuleRepository.save(module);

            const config = new CourseModuleConfig();
            config.isActive = createModuleDto.configuration?.isActive ?? true;
            config.courseModuleId = savedModule.id;
            config.order = createModuleDto.configuration?.order || 999999;
            config.approvalPercentage = createModuleDto.configuration?.approvalPercentage || 80;
            config.metadata = {};

            module.configuration = config;

            await this.courseModuleConfigRepository.save(config);

            return savedModule;
            
        } catch (error) {
            // Re-lanzar errores de validación
            if (error instanceof BadRequestException) {
            throw error;
            }
            
            // Log del error para debugging
            console.error('Error creando contenido:', error);
            throw new InternalServerErrorException('Error interno creando el contenido');
        }
    }

    findAll() {
        return `This action returns all modules`;
    }

    async findOne(id: string, tenantId: string) {
        try {
            // Buscar el módulo con sus relaciones directas
            const module = await this.courseModuleRepository.findOne({
                where: { 
                    id,
                    deletedAt: IsNull()
                },
                relations: [
                    'configuration',
                    'items', // Solo los items, sin contenido anidado
                    'course'
                ]
            });

            if (!module) {
                throw new BadRequestException('Módulo no encontrado');
            }

            // Validar que el módulo pertenece al tenant correcto
            if (module.course.tenantId !== tenantId) {
                throw new BadRequestException('No tienes permisos para acceder a este módulo');
            }

            // Validar que la configuración no esté eliminada
            if (module.configuration?.deletedAt) {
                throw new BadRequestException('Módulo no encontrado');
            }

            // Ordenar items por order
            if (module.items) {
                module.items.sort((a, b) => {
                    const orderA = a.order ?? 999999;
                    const orderB = b.order ?? 999999;
                    return orderA - orderB;
                });
            }

            return module;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error obteniendo módulo:', error);
            throw new InternalServerErrorException('Error interno obteniendo el módulo');
        }
    }

    // Método para obtener módulo con contenidos cargados
    async findOneWithContents(id: string, tenantId: string) {
        try {
            // Primero obtener el módulo básico
            const module = await this.findOne(id, tenantId);

            if (!module.items || module.items.length === 0) {
                return module;
            }

            // Separar items por tipo
            const contentItems = module.items.filter(item => item.type === 'content');
            
            if (contentItems.length > 0) {
                // Obtener los IDs de contenido
                const contentIds = contentItems.map(item => item.referenceId);

                // Cargar todos los contenidos de una vez
                const contents = await this.contentItemRepository.find({
                    where: {
                        id: In(contentIds),
                        tenantId,
                        deletedAt: IsNull()
                    }
                });

                // Crear un mapa para acceso rápido
                const contentsMap = new Map(contents.map(c => [c.id, c]));

                // Agregar los contenidos cargados a cada item
                const itemsWithContent = module.items.map(item => ({
                    ...item,
                    content: item.type === 'content' ? contentsMap.get(item.referenceId) : null
                }));

                return {
                    ...module,
                    items: itemsWithContent
                };
            }

            return module;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error obteniendo módulo con contenidos:', error);
            throw new InternalServerErrorException('Error interno obteniendo el módulo');
        }
    }

    async getModuleItems(moduleId: string, tenantId: string): Promise<ModuleWithResolvedItems> {
        try {
            // 1. Obtener el módulo con sus ítems y validar tenant
            const module = await this.courseModuleRepository.findOne({
                where: { id: moduleId, deletedAt: IsNull() },
                relations: ['items', 'course'],
            });

            if (!module) throw new BadRequestException('Módulo no encontrado');
            if (module.course.tenantId !== tenantId) {
                throw new BadRequestException('No tienes permisos para acceder a este módulo');
            }

             // Si no hay ítems, retornar el módulo con array vacío
            if (!module.items?.length) {
                return {
                    id: module.id,
                    title: module.title,
                    description: module.description,
                    courseId: module.courseId,
                    thumbnailImagePath: module.thumbnailImagePath,
                    createdAt: module.createdAt,
                    updatedAt: module.updatedAt,
                    configuration: module.configuration,
                    course: { id: module.course.id, tenantId: module.course.tenantId },
                    items: [],
                };
            }

            // Ordenar por order antes de resolver
            const sortedItems = [...module.items].sort(
                (a, b) => (a.order ?? 999999) - (b.order ?? 999999)
            );

            // 2. Agrupar los referenceIds por tipo para hacer una sola query por tipo
            const idsByType = sortedItems.reduce<Record<ModuleItemType, string[]>>(
                (acc, item) => {
                    acc[item.type] = acc[item.type] || [];
                    acc[item.type].push(item.referenceId);
                    return acc;
                },
                {} as Record<ModuleItemType, string[]>,
            );

            // 3. Cargar todos los datos en paralelo, solo los tipos presentes
            const [contents, forums, tasks, assessments, activities] = await Promise.all([
                idsByType[ModuleItemType.CONTENT]?.length
                    ? this.contentItemRepository.find({
                          where: { id: In(idsByType[ModuleItemType.CONTENT]), tenantId, deletedAt: IsNull() },
                      })
                    : [],

                idsByType[ModuleItemType.FORUM]?.length
                    ? this.forumRepository.find({
                          where: { id: In(idsByType[ModuleItemType.FORUM]), tenantId, deletedAt: IsNull() },
                      })
                    : [],

                idsByType[ModuleItemType.TASK]?.length
                    ? this.taskRepository.find({
                          where: { id: In(idsByType[ModuleItemType.TASK]), tenantId, deletedAt: IsNull() },
                      })
                    : [],

                // QUIZ y SURVEY apuntan a assessments
                [...(idsByType[ModuleItemType.QUIZ] || []), ...(idsByType[ModuleItemType.SURVEY] || [])].length
                    ? this.assessmentRepository.find({
                          where: {
                              id: In([
                                  ...(idsByType[ModuleItemType.QUIZ] || []),
                                  ...(idsByType[ModuleItemType.SURVEY] || []),
                              ]),
                              tenantId,
                              deleted_at: IsNull(),
                          },
                          relations: ['translations'],
                      })
                    : [],

                idsByType[ModuleItemType.ACTIVITY]?.length
                    ? this.activityRepository.find({
                          where: { id: In(idsByType[ModuleItemType.ACTIVITY]), tenantId, deleted_at: IsNull() },
                          relations: ['translations'],
                      })
                    : [],
            ]);

            // 4. Construir mapas para acceso O(1)
            const maps = {
                [ModuleItemType.CONTENT]:  new Map(contents.map(c => [c.id, c] as const)),
                [ModuleItemType.FORUM]:    new Map(forums.map(f => [f.id, f] as const)),
                [ModuleItemType.TASK]:     new Map(tasks.map(t => [t.id, t] as const)),
                [ModuleItemType.QUIZ]:     new Map(assessments.map(a => [a.id, a] as const)),
                [ModuleItemType.SURVEY]:   new Map(assessments.map(a => [a.id, a] as const)),
                [ModuleItemType.ACTIVITY]: new Map(activities.map(a => [a.id, a] as const)),
            };

            const resolvedItems = sortedItems.map<ResolvedModuleItem>(item => ({
                id: item.id,
                type: item.type,
                referenceId: item.referenceId,
                order: item.order,
                data: maps[item.type]?.get(item.referenceId) ?? null,
            }));

            // 5. Construir la respuesta final
            return {
                id: module.id,
                title: module.title,
                description: module.description,
                courseId: module.courseId,
                thumbnailImagePath: module.thumbnailImagePath,
                createdAt: module.createdAt,
                updatedAt: module.updatedAt,
                configuration: module.configuration,
                course: { id: module.course.id, tenantId: module.course.tenantId },
                items: resolvedItems,
            };

        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('Error obteniendo ítems del módulo:', error);
            throw new InternalServerErrorException('Error interno obteniendo los ítems del módulo');
        }
    }

    update(id: number, updateModuleDto: UpdateModuleDto) {
        return `This action updates a #${id} module`;
    }

    remove(id: number) {
        return `This action removes a #${id} module`;
    }

    async addModuleItem(
        moduleId: string,
        dto: AddModuleItemDto,
        tenantId: string,
    ): Promise<ModuleItem> {
        // 1. Validar que el módulo existe y pertenece al tenant
        const module = await this.courseModuleRepository.findOne({
            where: { id: moduleId, deletedAt: IsNull() },
            relations: ['course', 'items'],
        });

        if (!module) throw new BadRequestException('Módulo no encontrado');
        if (module.course.tenantId !== tenantId) {
            throw new BadRequestException('No tienes permisos para modificar este módulo');
        }

        // 2. Validar que el referenceId existe en la entidad correcta según el tipo
        await this.validateReference(dto.type, dto.referenceId, tenantId);

        // 3. Evitar duplicados
        const alreadyExists = module.items?.some(
            (i) => i.type === dto.type && i.referenceId === dto.referenceId,
        );
        if (alreadyExists) {
            throw new BadRequestException('Este ítem ya está agregado al módulo');
        }

        // 4. Calcular el siguiente order
        const maxOrder = module.items?.reduce(
            (max, i) => Math.max(max, i.order ?? 0),
            0,
        ) ?? 0;

        // 5. Crear y persistir el ítem
        const item = this.moduleItemRepository.create({
            moduleId,
            type: dto.type,
            referenceId: dto.referenceId,
            order: maxOrder + 1,
        });

        return this.moduleItemRepository.save(item);
    }

    async removeModuleItem(
        moduleId: string,
        itemId: string,
        tenantId: string,
    ): Promise<void> {
        // 1. Validar que el módulo existe y pertenece al tenant
        const module = await this.courseModuleRepository.findOne({
            where: { id: moduleId, deletedAt: IsNull() },
            relations: ['course'],
        });

        if (!module) throw new BadRequestException('Módulo no encontrado');
        if (module.course.tenantId !== tenantId) {
            throw new BadRequestException('No tienes permisos para modificar este módulo');
        }

        // 2. Encontrar el ítem dentro del módulo
        const item = await this.moduleItemRepository.findOne({
            where: { id: itemId, moduleId },
        });

        if (!item) throw new BadRequestException('Ítem no encontrado en este módulo');

        await this.moduleItemRepository.remove(item);
    }

    // ── Helper privado ──────────────────────────────────────────────────────────

    private async validateReference(
        type: ModuleItemType,
        referenceId: string,
        tenantId: string,
    ): Promise<void> {
        let exists = false;

        switch (type) {
            case ModuleItemType.CONTENT:
                exists = !!(await this.contentItemRepository.findOne({
                    where: { id: referenceId, tenantId, deletedAt: IsNull() },
                }));
                break;
            case ModuleItemType.FORUM:
                exists = !!(await this.forumRepository.findOne({
                    where: { id: referenceId, tenantId, deletedAt: IsNull() },
                }));
                break;
            case ModuleItemType.TASK:
                exists = !!(await this.taskRepository.findOne({
                    where: { id: referenceId, tenantId, deletedAt: IsNull() },
                }));
                break;
            case ModuleItemType.QUIZ:
            case ModuleItemType.SURVEY:
                exists = !!(await this.assessmentRepository.findOne({
                    where: { id: referenceId, tenantId, deleted_at: IsNull() },
                }));
                break;
            case ModuleItemType.ACTIVITY:
                exists = !!(await this.activityRepository.findOne({
                    where: { id: referenceId, tenantId, deleted_at: IsNull() },
                }));
                break;
            default:
                throw new BadRequestException(`Tipo de ítem no soportado: ${type}`);
        }

        if (!exists) {
            throw new BadRequestException(
                `No se encontró ningún recurso de tipo "${type}" con el ID proporcionado`,
            );
        }
    }
    
    async getAvailableItemsByCourse(courseId: string, tenantId: string) {
        // 1. Validar que el curso existe y pertenece al tenant
        const course = await this.coursesRepository.findOne({
            where: { id: courseId, tenantId, deleted_at: IsNull() },
        });
        if (!course) throw new BadRequestException('Curso no encontrado');

        // 2. Obtener todos los IDs de los ítems ya asignados a módulos de este curso
        // Buscamos en la tabla intermedia de los módulos
        const assignedItems = await this.moduleItemRepository.find({
            where: {
                module: { courseId: courseId }
            },
            select: ['referenceId', 'type']
        });

        // Agrupamos las IDs asignadas por tipo para filtrarlas en las consultas posteriores
        const assignedIds = {
            content:  assignedItems.filter(i => i.type === ModuleItemType.CONTENT).map(i => i.referenceId),
            forum:    assignedItems.filter(i => i.type === ModuleItemType.FORUM).map(i => i.referenceId),
            task:     assignedItems.filter(i => i.type === ModuleItemType.TASK).map(i => i.referenceId),
            quiz:     assignedItems.filter(i => i.type === ModuleItemType.QUIZ).map(i => i.referenceId),
            survey:   assignedItems.filter(i => i.type === ModuleItemType.SURVEY).map(i => i.referenceId),
            activity: assignedItems.filter(i => i.type === ModuleItemType.ACTIVITY).map(i => i.referenceId),
        };

        // 3. Consultar los elementos DISPONIBLES (Tenant ID coincide Y NO están en la lista de asignados)
        const [contents, forums, tasks, quizzes, surveys, activities] = await Promise.all([
            this.contentItemRepository
                .createQueryBuilder('content')
                .innerJoin('content.courses', 'course') 
                .where('course.id = :courseId', { courseId })
                .andWhere('content.tenantId = :tenantId', { tenantId })
                .andWhere('content.deletedAt IS NULL')
                .andWhere(
                    assignedIds.content.length > 0 
                    ? 'content.id NOT IN (:...assignedContentIds)' 
                    : '1=1', 
                    { assignedContentIds: assignedIds.content }
                )
                .select([
                    'content.id',
                    'content.title',
                    'content.contentType',
                ])
                .getMany(),

            // Foros: Generalmente ligados al curso, pero buscamos los que no están en módulos
            this.forumRepository.find({
                where: {
                    courseId,
                    tenantId,
                    deletedAt: IsNull(),
                    ...(assignedIds.forum.length > 0 && { id: Not(In(assignedIds.forum)) })
                },
                select: ['id', 'title']
            }),

            // Tareas
            this.taskRepository.find({
                where: {
                    courseId,
                    tenantId,
                    deletedAt: IsNull(),
                    ...(assignedIds.task.length > 0 && { id: Not(In(assignedIds.task)) })
                },
                select: ['id', 'title']
            }),

            // Evaluaciones (Quizzes)
            this.assessmentRepository.find({
                where: {
                    courseId,
                    tenantId,
                    type: AssessmentType.EVALUATION,
                    deleted_at: IsNull(),
                    ...(assignedIds.quiz.length > 0 && { id: Not(In(assignedIds.quiz)) })
                },
                relations: ['translations']
            }),

            // Encuestas (Surveys)
            this.assessmentRepository.find({
                where: {
                    courseId,
                    tenantId,
                    type: AssessmentType.SURVEY,
                    deleted_at: IsNull(),
                    ...(assignedIds.survey.length > 0 && { id: Not(In(assignedIds.survey)) })
                },
                relations: ['translations']
            }),

            // Actividades H5P / Otros
            this.activityRepository.find({
                where: {
                    courseId,
                    tenantId,
                    deleted_at: IsNull(),
                    ...(assignedIds.activity.length > 0 && { id: Not(In(assignedIds.activity)) })
                },
                relations: ['translations']
            }),
        ]);

        console.log('Items disponibles para agregar al módulo:', {
            contents: contents.map(c => ({ id: c.id, title: c.title })),
            forums: forums.map(f => ({ id: f.id, title: f.title })),
            tasks: tasks.map(t => ({ id: t.id, title: t.title })),
            quizzes: quizzes.map(q => ({ id: q.id, title: q.getTranslatedTitle('es') })),
            surveys: surveys.map(s => ({ id: s.id, title: s.getTranslatedTitle('es') })),
            activities: activities.map(a => ({ id: a.id, title: a.getTranslatedTitle('es') })),
        });

        // 4. Formatear respuesta
        return {
            success: true,
            data: {
                content:  contents.map(c  => ({ id: c.id, title: c.title, subtitle: c.contentType })),
                forum:    forums.map(f    => ({ id: f.id, title: f.title })),
                task:     tasks.map(t     => ({ id: t.id, title: t.title })),
                quiz:     quizzes.map(q   => ({ id: q.id, title: q.getTranslatedTitle('es') })),
                survey:   surveys.map(s   => ({ id: s.id, title: s.getTranslatedTitle('es') })),
                activity: activities.map(a => ({ id: a.id, title: a.getTranslatedTitle('es') })),
            },
        };
    }
}

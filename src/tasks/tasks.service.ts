import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus } from './entities/courses-tasks.entity';
import { TaskConfig } from './entities/courses-tasks-config.entity';
import { Repository } from 'typeorm';
import { Courses } from 'src/courses/entities/courses.entity';
import { GetAllTasksOptions, PaginatedTaskResponse, TaskStats } from './interfaces/tasks.interface';

@Injectable()
export class TasksService {

    constructor(
        @InjectRepository(Courses)
        private readonly courseRepository: Repository<Courses>,

        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(TaskConfig)
        private readonly taskConfigRepository: Repository<TaskConfig>
    ) { }

    create(createTaskDto: CreateTaskDto) {
        return 'This action adds a new task';
    }

    findAll() {
        return `This action returns all tasks`;
    }

    findOne(id: number) {
        return `This action returns a #${id} task`;
    }

    update(id: number, updateTaskDto: UpdateTaskDto) {
        return `This action updates a #${id} task`;
    }

    remove(id: number) {
        return `This action removes a #${id} task`;
    }


    async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
        try {
            // Validaciones básicas
            if (!createTaskDto.title?.trim()) {
                throw new BadRequestException('El título de la tarea es requerido');
            }

            if (!createTaskDto.tenantId) {
                throw new BadRequestException('El tenantId es requerido');
            }

            if (!createTaskDto.courseId) {
                throw new BadRequestException('El courseId es requerido');
            }

            if (!createTaskDto.endDate) {
                throw new BadRequestException('La fecha de entrega es requerida');
            }

            // Verificar que el curso existe
            const course = await this.courseRepository.findOne({
                where: {
                    id: createTaskDto.courseId,
                    tenantId: createTaskDto.tenantId
                }
            });

            if (!course) {
                throw new NotFoundException('El curso especificado no existe');
            }

            // Validar fechas
            const startDate = createTaskDto.startDate ? new Date(createTaskDto.startDate) : null;
            const endDate = new Date(createTaskDto.endDate);
            const lateSubmissionDate = createTaskDto.lateSubmissionDate
                ? new Date(createTaskDto.lateSubmissionDate)
                : null;

            // Validar que endDate sea futuro
            if (endDate <= new Date()) {
                throw new BadRequestException('La fecha de entrega debe ser futura');
            }

            // Validar que startDate sea antes de endDate
            if (startDate && startDate >= endDate) {
                throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de entrega');
            }

            // Validar que lateSubmissionDate sea después de endDate
            if (lateSubmissionDate && lateSubmissionDate <= endDate) {
                throw new BadRequestException('La fecha de entrega tardía debe ser posterior a la fecha de entrega');
            }

            // Validar tipos de archivo si se proporcionan
            if (createTaskDto.allowedFileTypes?.length) {
                const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'zip', 'rar'];
                const invalidTypes = createTaskDto.allowedFileTypes.filter(
                    type => !validExtensions.includes(type.toLowerCase())
                );

                if (invalidTypes.length > 0) {
                    throw new BadRequestException(
                        `Tipos de archivo inválidos: ${invalidTypes.join(', ')}`
                    );
                }
            }

            // Crear la tarea
            const task = new Task();
            task.title = createTaskDto.title.trim();
            task.description = createTaskDto.description?.trim() || '';
            task.instructions = createTaskDto.instructions?.trim() || '';
            task.courseId = createTaskDto.courseId;
            task.tenantId = createTaskDto.tenantId;
            task.createdBy = createTaskDto.createdBy || '';
            task.status = createTaskDto.status || TaskStatus.DRAFT;

            // Fechas
            task.startDate = startDate ?? new Date();
            task.endDate = endDate ?? new Date((startDate ?? new Date()).getTime() + 7 * 24 * 60 * 60 * 1000);
            task.lateSubmissionDate = lateSubmissionDate ?? (endDate ? new Date(endDate.getTime() + 3 * 24 * 60 * 60 * 1000) : new Date()); // 3 días después

            // Calificación
            task.maxPoints = createTaskDto.maxPoints ?? 100;
            task.lateSubmissionPenalty = createTaskDto.lateSubmissionPenalty ?? 0;

            // Configuración de archivos
            task.maxFileUploads = createTaskDto.maxFileUploads ?? 3;
            task.maxFileSize = createTaskDto.maxFileSize ?? 10;
            task.allowedFileTypes = createTaskDto.allowedFileTypes ?? ['pdf', 'doc', 'docx', 'jpg', 'png'];

            // Configuración de envíos
            task.allowMultipleSubmissions = createTaskDto.allowMultipleSubmissions ?? true;
            task.maxSubmissionAttempts = createTaskDto.maxSubmissionAttempts ?? null;
            task.requireSubmission = createTaskDto.requireSubmission ?? true; // Si la tarea requiere obligatoriamente un envío
            task.enablePeerReview = createTaskDto.enablePeerReview ?? false;

            // Visualización
            task.thumbnailImagePath = createTaskDto.thumbnailImagePath ?? '';
            task.order = createTaskDto.order ?? 0;
            task.showGradeToStudent = createTaskDto.showGradeToStudent ?? true; // Si muestra la calificación al estudiante
            task.showFeedbackToStudent = createTaskDto.showFeedbackToStudent ?? true; // Si muestra retroalimentación al estudiante
            task.notifyOnSubmission = createTaskDto.notifyOnSubmission ?? false;

            task.metadata = createTaskDto.metadata ?? {};

            // Guardar la tarea
            const savedTask = await this.taskRepository.save(task);

            // Crear configuración si se proporciona
            if (createTaskDto.configuration) {
                const taskConfig = new TaskConfig();
                taskConfig.taskId = savedTask.id;

                // Asignar todas las propiedades de configuración
                Object.assign(taskConfig, {
                    isActive: createTaskDto.configuration.isActive ?? true,
                    enableSupportResources: createTaskDto.configuration.enableSupportResources ?? false,
                    showResourcesBeforeSubmission: createTaskDto.configuration.showResourcesBeforeSubmission ?? false,
                    enableSelfAssessment: createTaskDto.configuration.enableSelfAssessment ?? false,
                    requireSelfAssessmentBeforeSubmit: createTaskDto.configuration.requireSelfAssessmentBeforeSubmit ?? false,
                    enableFileUpload: createTaskDto.configuration.enableFileUpload ?? true,
                    requireFileUpload: createTaskDto.configuration.requireFileUpload ?? false,
                    enableTextSubmission: createTaskDto.configuration.enableTextSubmission ?? false,
                    requireTextSubmission: createTaskDto.configuration.requireTextSubmission ?? false,
                    showToStudentsBeforeStart: createTaskDto.configuration.showToStudentsBeforeStart ?? true,
                    sendReminderBeforeDue: createTaskDto.configuration.sendReminderBeforeDue ?? true,
                    reminderHoursBeforeDue: createTaskDto.configuration.reminderHoursBeforeDue ?? 24,
                    notifyOnGrade: createTaskDto.configuration.notifyOnGrade ?? true,
                    autoGrade: createTaskDto.configuration.autoGrade ?? false,
                    requireGradeComment: createTaskDto.configuration.requireGradeComment ?? false,
                    enableGradeRubric: createTaskDto.configuration.enableGradeRubric ?? false,
                    rubricData: createTaskDto.configuration.rubricData ?? null,
                    showOtherSubmissions: createTaskDto.configuration.showOtherSubmissions ?? false,
                    anonymizeSubmissions: createTaskDto.configuration.anonymizeSubmissions ?? false,
                    enableGroupSubmission: createTaskDto.configuration.enableGroupSubmission ?? false,
                    maxGroupSize: createTaskDto.configuration.maxGroupSize ?? null,
                    enableVersionControl: createTaskDto.configuration.enableVersionControl ?? false,
                    lockAfterGrade: createTaskDto.configuration.lockAfterGrade ?? false,
                    metadata: createTaskDto.configuration.metadata ?? {},
                });

                await this.taskConfigRepository.save(taskConfig);
            } else {
                // Crear configuración por defecto
                const defaultConfig = new TaskConfig();
                defaultConfig.taskId = savedTask.id;
                defaultConfig.isActive = true;
                defaultConfig.enableFileUpload = true;
                defaultConfig.metadata = {};

                await this.taskConfigRepository.save(defaultConfig);
            }

            // Cargar la tarea con sus relaciones
            const taskWithRelations = await this.taskRepository.findOne({
                where: { id: savedTask.id },
                relations: ['configuration', 'course', 'creator']
            });

            if (!taskWithRelations) {
                throw new InternalServerErrorException(
                    'Error al recuperar la tarea creada'
                );
            }

            return taskWithRelations;

        } catch (error) {
            // Si es una excepción conocida, la relanzamos
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            // Log del error para debugging
            console.error('Error al crear tarea:', error);

            // Lanzar excepción genérica
            throw new InternalServerErrorException(
                'Error al crear la tarea. Por favor, inténtalo de nuevo.'
            );
        }
    }

    async getAll(options: GetAllTasksOptions): Promise<PaginatedTaskResponse> {
        try {
            const { courseId, search, page = 1, limit = 12, tenantId } = options;

            if (!courseId) {
                throw new BadRequestException('El courseId es requerido');
            }

            // Verificar que el curso existe y pertenece al tenant
            const course = await this.courseRepository.findOne({
                where: { id: courseId, tenantId }
            });

            if (!course) {
                throw new NotFoundException('Curso no encontrado');
            }

            // Query builder para búsqueda flexible
            const queryBuilder = this.taskRepository
                .createQueryBuilder('task')
                .leftJoinAndSelect('task.creator', 'creator')
                .leftJoinAndSelect('task.configuration', 'configuration')
                .where('task.courseId = :courseId', { courseId })
                .andWhere('task.tenantId = :tenantId', { tenantId });

            // Aplicar búsqueda si existe
            if (search && search.trim()) {
                queryBuilder.andWhere(
                    '(task.title ILIKE :search OR task.description ILIKE :search OR task.instructions ILIKE :search)',
                    { search: `%${search.trim()}%` }
                );
            }

            // Contar total antes de paginar
            const total = await queryBuilder.getCount();

            // Aplicar paginación y ordenamiento
            const data = await queryBuilder
                .orderBy('task.order', 'ASC')
                .addOrderBy('task.createdAt', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getMany();

            const totalPages = Math.ceil(total / limit);

            // Calcular estadísticas
            const stats = await this.calculateStatsByCourse(courseId, tenantId);

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
                stats,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            console.error('Error obteniendo tareas:', error);
            throw new InternalServerErrorException('Error interno obteniendo las tareas');
        }
    }

    // Método auxiliar actualizado para calcular stats
    private async calculateStatsByCourse(courseId: string, tenantId: string): Promise<TaskStats> {
        const tasks = await this.taskRepository.find({
            where: { courseId, tenantId },
            relations: ['submissions']
        });

        const totalTasks = tasks.length;
        
        // Contar total de envíos
        const totalSubmissions = tasks.reduce((acc, task) => 
            acc + (task.submissions?.length || 0), 0
        );
        
        // Contar envíos calificados
        const gradedSubmissions = tasks.reduce((acc, task) => 
            acc + (task.submissions?.filter(sub => sub.status === 'graded').length || 0), 0
        );
        
        // Contar usuarios únicos que han enviado tareas
        const uniqueUsers = new Set<string>();
        tasks.forEach(task => {
            task.submissions?.forEach(submission => {
                if (submission.userId) {
                    uniqueUsers.add(submission.userId);
                }
            });
        });

        return {
            totalTasks,
            totalSubmissions,
            gradedSubmissions,
            activeUsers: uniqueUsers.size
        };
    }
}

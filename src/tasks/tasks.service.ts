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
            // ==================== VALIDACIONES BÁSICAS ====================
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

            // ==================== VERIFICAR QUE EL CURSO EXISTE ====================
            const course = await this.courseRepository.findOne({
                where: {
                    id: createTaskDto.courseId,
                    tenantId: createTaskDto.tenantId
                }
            });

            if (!course) {
                throw new NotFoundException('El curso especificado no existe');
            }

            // ==================== VALIDAR FECHAS ====================
            const now = new Date();
            const startDate = createTaskDto.startDate ? new Date(createTaskDto.startDate) : null;
            const endDate = new Date(createTaskDto.endDate);
            const lateSubmissionDate = createTaskDto.lateSubmissionDate
                ? new Date(createTaskDto.lateSubmissionDate)
                : null;

            // Validar que endDate sea futuro
            if (endDate <= now) {
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

            // ==================== VALIDAR TIPOS DE ARCHIVO ====================
            if (createTaskDto.allowedFileTypes?.length) {
                const validExtensions = [
                    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                    'jpg', 'jpeg', 'png', 'gif', 'webp',
                    'txt', 'zip', 'rar', '7z'
                ];
                const invalidTypes = createTaskDto.allowedFileTypes.filter(
                    type => !validExtensions.includes(type.toLowerCase())
                );

                if (invalidTypes.length > 0) {
                    throw new BadRequestException(
                        `Tipos de archivo inválidos: ${invalidTypes.join(', ')}`
                    );
                }
            }

            // ==================== VALIDAR PUNTOS Y PENALIZACIONES ====================
            if (createTaskDto.maxPoints !== undefined && createTaskDto.maxPoints < 0) {
                throw new BadRequestException('Los puntos máximos no pueden ser negativos');
            }

            if (createTaskDto.lateSubmissionPenalty !== undefined) {
                if (createTaskDto.lateSubmissionPenalty < 0 || createTaskDto.lateSubmissionPenalty > 100) {
                    throw new BadRequestException('La penalización debe estar entre 0 y 100%');
                }
            }

            // ==================== VALIDAR CONFIGURACIÓN DE ARCHIVOS ====================
            if (createTaskDto.maxFileUploads !== undefined) {
                if (createTaskDto.maxFileUploads < 0 || createTaskDto.maxFileUploads > 20) {
                    throw new BadRequestException('El número de archivos debe estar entre 0 y 20');
                }
            }

            if (createTaskDto.maxFileSize !== undefined) {
                if (createTaskDto.maxFileSize < 1 || createTaskDto.maxFileSize > 100) {
                    throw new BadRequestException('El tamaño de archivo debe estar entre 1 y 100 MB');
                }
            }

            // ==================== VALIDAR INTENTOS DE ENVÍO ====================
            if (createTaskDto.maxSubmissionAttempts !== undefined && createTaskDto.maxSubmissionAttempts !== null) {
                if (createTaskDto.maxSubmissionAttempts < 1 || createTaskDto.maxSubmissionAttempts > 10) {
                    throw new BadRequestException('Los intentos deben estar entre 1 y 10');
                }
            }

            // ==================== CREAR LA TAREA ====================
            const task = new Task();
            
            // Información básica
            task.title = createTaskDto.title.trim();
            task.description = createTaskDto.description?.trim() || '';
            task.instructions = createTaskDto.instructions?.trim() || '';
            task.courseId = createTaskDto.courseId;
            task.tenantId = createTaskDto.tenantId;
            task.createdBy = createTaskDto.createdBy || '';
            task.status = createTaskDto.status || TaskStatus.DRAFT;

            // Fechas
            task.startDate = startDate || new Date();
            task.endDate = endDate;
            task.lateSubmissionDate = lateSubmissionDate ?? null;

            // Calificación
            task.maxPoints = createTaskDto.maxPoints ?? 100;
            task.lateSubmissionPenalty = createTaskDto.lateSubmissionPenalty ?? 0;

            // Configuración de archivos
            task.maxFileUploads = createTaskDto.maxFileUploads ?? 5;
            task.maxFileSize = createTaskDto.maxFileSize ?? 10;
            task.allowedFileTypes = createTaskDto.allowedFileTypes ?? ['pdf', 'doc', 'docx', 'jpg', 'png'];

            // Configuración de envíos
            task.allowMultipleSubmissions = createTaskDto.allowMultipleSubmissions ?? true;
            task.maxSubmissionAttempts = createTaskDto.maxSubmissionAttempts ?? null;
            task.requireSubmission = createTaskDto.requireSubmission ?? true;
            task.enablePeerReview = createTaskDto.enablePeerReview ?? false;

            // Visualización
            task.thumbnailImagePath = createTaskDto.thumbnailImagePath ?? '';
            task.order = createTaskDto.order ?? 0;
            task.showGradeToStudent = createTaskDto.showGradeToStudent ?? true;
            task.showFeedbackToStudent = createTaskDto.showFeedbackToStudent ?? true;
            task.notifyOnSubmission = createTaskDto.notifyOnSubmission ?? false;

            // Metadata
            task.metadata = createTaskDto.metadata ?? {};

            // ==================== GUARDAR LA TAREA ====================
            const savedTask = await this.taskRepository.save(task);

            // ==================== CREAR CONFIGURACIÓN ====================
            if (createTaskDto.configuration) {
                const taskConfig = new TaskConfig();
                taskConfig.taskId = savedTask.id;
                taskConfig.tenantId = createTaskDto.tenantId;

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
                    autoGrade: createTaskDto.isAutoGradable ?? false,
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
                defaultConfig.tenantId = createTaskDto.tenantId;
                defaultConfig.isActive = true;
                defaultConfig.enableFileUpload = true;
                defaultConfig.showToStudentsBeforeStart = true;
                defaultConfig.sendReminderBeforeDue = true;
                defaultConfig.reminderHoursBeforeDue = 24;
                defaultConfig.notifyOnGrade = true;
                defaultConfig.metadata = {};

                await this.taskConfigRepository.save(defaultConfig);
            }

            // ==================== CARGAR TAREA CON RELACIONES ====================
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

    async updateTask(
        taskId: string,
        tenantId: string,
        updateTaskDto: UpdateTaskDto
    ): Promise<Task> {
        try {
            // ==================== BUSCAR TAREA EXISTENTE ====================
            const existingTask = await this.taskRepository.findOne({
                where: {
                    id: taskId,
                    tenantId: tenantId
                },
                relations: ['configuration', 'course']
            });

            if (!existingTask) {
                throw new NotFoundException('La tarea no existe o no pertenece a este tenant');
            }

            // ==================== VALIDACIONES BÁSICAS ====================
            if (updateTaskDto.title !== undefined && !updateTaskDto.title?.trim()) {
                throw new BadRequestException('El título de la tarea no puede estar vacío');
            }

            // ==================== VALIDAR CURSO SI SE PROPORCIONA ====================
            if (updateTaskDto.courseId && updateTaskDto.courseId !== existingTask.courseId) {
                const course = await this.courseRepository.findOne({
                    where: {
                        id: updateTaskDto.courseId,
                        tenantId: tenantId
                    }
                });

                if (!course) {
                    throw new NotFoundException('El curso especificado no existe');
                }
            }

            // ==================== VALIDAR FECHAS ====================
            const now = new Date();
            let startDate = existingTask.startDate;
            let endDate: any = existingTask.endDate;
            let lateSubmissionDate = existingTask.lateSubmissionDate;

            // Normalizar: sin segundos ni milisegundos
            const normalizeDate = (date: Date) => {
                date.setSeconds(0);
                date.setMilliseconds(0);
                return date;
            };

            // ------ START DATE ------
            if (updateTaskDto.startDate !== undefined) {
                startDate = updateTaskDto.startDate
                    ? normalizeDate(new Date(updateTaskDto.startDate))
                    : normalizeDate(new Date());
            }

            // ------ END DATE ------
            if (updateTaskDto.endDate !== undefined) {
                endDate = updateTaskDto.endDate
                    ? normalizeDate(new Date(updateTaskDto.endDate))
                    : null;
            }

            // ------ LATE SUBMISSION DATE ------
            if (updateTaskDto.lateSubmissionDate !== undefined) {
                lateSubmissionDate = updateTaskDto.lateSubmissionDate
                    ? normalizeDate(new Date(updateTaskDto.lateSubmissionDate))
                    : null;
            }

            // ==================== VALIDACIONES ====================
            if (startDate && endDate && startDate >= endDate) {
                throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de entrega');
            }

            if (lateSubmissionDate && endDate && lateSubmissionDate <= endDate) {
                throw new BadRequestException('La fecha de entrega tardía debe ser posterior a la fecha de entrega');
            }

            // ==================== VALIDAR TIPOS DE ARCHIVO ====================
            if (updateTaskDto.allowedFileTypes?.length) {
                const validExtensions = [
                    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                    'jpg', 'jpeg', 'png', 'gif', 'webp',
                    'txt', 'zip', 'rar', '7z'
                ];
                const invalidTypes = updateTaskDto.allowedFileTypes.filter(
                    type => !validExtensions.includes(type.toLowerCase())
                );

                if (invalidTypes.length > 0) {
                    throw new BadRequestException(
                        `Tipos de archivo inválidos: ${invalidTypes.join(', ')}`
                    );
                }
            }

            // ==================== VALIDAR PUNTOS Y PENALIZACIONES ====================
            if (updateTaskDto.maxPoints !== undefined && updateTaskDto.maxPoints < 0) {
                throw new BadRequestException('Los puntos máximos no pueden ser negativos');
            }

            if (updateTaskDto.lateSubmissionPenalty !== undefined) {
                if (updateTaskDto.lateSubmissionPenalty < 0 || updateTaskDto.lateSubmissionPenalty > 100) {
                    throw new BadRequestException('La penalización debe estar entre 0 y 100%');
                }
            }

            // ==================== VALIDAR CONFIGURACIÓN DE ARCHIVOS ====================
            if (updateTaskDto.maxFileUploads !== undefined) {
                if (updateTaskDto.maxFileUploads < 0 || updateTaskDto.maxFileUploads > 20) {
                    throw new BadRequestException('El número de archivos debe estar entre 0 y 20');
                }
            }

            if (updateTaskDto.maxFileSize !== undefined) {
                if (updateTaskDto.maxFileSize < 1 || updateTaskDto.maxFileSize > 100) {
                    throw new BadRequestException('El tamaño de archivo debe estar entre 1 y 100 MB');
                }
            }

            // ==================== VALIDAR INTENTOS DE ENVÍO ====================
            if (updateTaskDto.maxSubmissionAttempts !== undefined && updateTaskDto.maxSubmissionAttempts !== null) {
                if (updateTaskDto.maxSubmissionAttempts < 1 || updateTaskDto.maxSubmissionAttempts > 10) {
                    throw new BadRequestException('Los intentos deben estar entre 1 y 10');
                }
            }

            // ==================== ACTUALIZAR CAMPOS DE LA TAREA ====================
            if (updateTaskDto.title !== undefined) {
                existingTask.title = updateTaskDto.title.trim();
            }

            if (updateTaskDto.description !== undefined) {
                existingTask.description = updateTaskDto.description?.trim() || '';
            }

            if (updateTaskDto.instructions !== undefined) {
                existingTask.instructions = updateTaskDto.instructions?.trim() || '';
            }

            if (updateTaskDto.courseId !== undefined) {
                existingTask.courseId = updateTaskDto.courseId;
            }

            if (updateTaskDto.status !== undefined) {
                existingTask.status = updateTaskDto.status;
            }

            // Actualizar fechas
            existingTask.startDate = startDate;
            existingTask.endDate = endDate;
            existingTask.lateSubmissionDate = lateSubmissionDate;

            // Actualizar calificación
            if (updateTaskDto.maxPoints !== undefined) {
                existingTask.maxPoints = updateTaskDto.maxPoints;
            }

            if (updateTaskDto.lateSubmissionPenalty !== undefined) {
                existingTask.lateSubmissionPenalty = updateTaskDto.lateSubmissionPenalty;
            }

            // Actualizar configuración de archivos
            if (updateTaskDto.maxFileUploads !== undefined) {
                existingTask.maxFileUploads = updateTaskDto.maxFileUploads;
            }

            if (updateTaskDto.maxFileSize !== undefined) {
                existingTask.maxFileSize = updateTaskDto.maxFileSize;
            }

            if (updateTaskDto.allowedFileTypes !== undefined) {
                existingTask.allowedFileTypes = updateTaskDto.allowedFileTypes;
            }

            // Actualizar configuración de envíos
            if (updateTaskDto.allowMultipleSubmissions !== undefined) {
                existingTask.allowMultipleSubmissions = updateTaskDto.allowMultipleSubmissions;
            }

            if (updateTaskDto.maxSubmissionAttempts !== undefined) {
                existingTask.maxSubmissionAttempts = updateTaskDto.maxSubmissionAttempts;
            }

            if (updateTaskDto.requireSubmission !== undefined) {
                existingTask.requireSubmission = updateTaskDto.requireSubmission;
            }

            if (updateTaskDto.enablePeerReview !== undefined) {
                existingTask.enablePeerReview = updateTaskDto.enablePeerReview;
            }

            // Actualizar visualización
            if (updateTaskDto.thumbnailImagePath !== undefined) {
                existingTask.thumbnailImagePath = updateTaskDto.thumbnailImagePath;
            }

            if (updateTaskDto.order !== undefined) {
                existingTask.order = updateTaskDto.order;
            }

            if (updateTaskDto.showGradeToStudent !== undefined) {
                existingTask.showGradeToStudent = updateTaskDto.showGradeToStudent;
            }

            if (updateTaskDto.showFeedbackToStudent !== undefined) {
                existingTask.showFeedbackToStudent = updateTaskDto.showFeedbackToStudent;
            }

            if (updateTaskDto.notifyOnSubmission !== undefined) {
                existingTask.notifyOnSubmission = updateTaskDto.notifyOnSubmission;
            }

            // Actualizar metadata
            if (updateTaskDto.metadata !== undefined) {
                existingTask.metadata = {
                    ...existingTask.metadata,
                    ...updateTaskDto.metadata
                };
            }

            // ==================== GUARDAR TAREA ACTUALIZADA ====================
            const updatedTask = await this.taskRepository.save(existingTask);

            // ==================== ACTUALIZAR O CREAR CONFIGURACIÓN ====================
            if (updateTaskDto.configuration) {
                let taskConfig = existingTask.configuration;

                if (!taskConfig) {
                    // Crear nueva configuración si no existe
                    taskConfig = new TaskConfig();
                    taskConfig.taskId = updatedTask.id;
                    taskConfig.tenantId = tenantId;
                }

                // Actualizar campos de configuración
                if (updateTaskDto.configuration.isActive !== undefined) {
                    taskConfig.isActive = updateTaskDto.configuration.isActive;
                }

                if (updateTaskDto.configuration.enableSupportResources !== undefined) {
                    taskConfig.enableSupportResources = updateTaskDto.configuration.enableSupportResources;
                }

                if (updateTaskDto.configuration.showResourcesBeforeSubmission !== undefined) {
                    taskConfig.showResourcesBeforeSubmission = updateTaskDto.configuration.showResourcesBeforeSubmission;
                }

                if (updateTaskDto.configuration.enableSelfAssessment !== undefined) {
                    taskConfig.enableSelfAssessment = updateTaskDto.configuration.enableSelfAssessment;
                }

                if (updateTaskDto.configuration.requireSelfAssessmentBeforeSubmit !== undefined) {
                    taskConfig.requireSelfAssessmentBeforeSubmit = updateTaskDto.configuration.requireSelfAssessmentBeforeSubmit;
                }

                if (updateTaskDto.configuration.enableFileUpload !== undefined) {
                    taskConfig.enableFileUpload = updateTaskDto.configuration.enableFileUpload;
                }

                if (updateTaskDto.configuration.requireFileUpload !== undefined) {
                    taskConfig.requireFileUpload = updateTaskDto.configuration.requireFileUpload;
                }

                if (updateTaskDto.configuration.enableTextSubmission !== undefined) {
                    taskConfig.enableTextSubmission = updateTaskDto.configuration.enableTextSubmission;
                }

                if (updateTaskDto.configuration.requireTextSubmission !== undefined) {
                    taskConfig.requireTextSubmission = updateTaskDto.configuration.requireTextSubmission;
                }

                if (updateTaskDto.configuration.showToStudentsBeforeStart !== undefined) {
                    taskConfig.showToStudentsBeforeStart = updateTaskDto.configuration.showToStudentsBeforeStart;
                }

                if (updateTaskDto.configuration.sendReminderBeforeDue !== undefined) {
                    taskConfig.sendReminderBeforeDue = updateTaskDto.configuration.sendReminderBeforeDue;
                }

                if (updateTaskDto.configuration.reminderHoursBeforeDue !== undefined) {
                    taskConfig.reminderHoursBeforeDue = updateTaskDto.configuration.reminderHoursBeforeDue;
                }

                if (updateTaskDto.configuration.notifyOnGrade !== undefined) {
                    taskConfig.notifyOnGrade = updateTaskDto.configuration.notifyOnGrade;
                }

                if (updateTaskDto.isAutoGradable !== undefined) {
                    taskConfig.autoGrade = updateTaskDto.isAutoGradable;
                }

                if (updateTaskDto.configuration.requireGradeComment !== undefined) {
                    taskConfig.requireGradeComment = updateTaskDto.configuration.requireGradeComment;
                }

                if (updateTaskDto.configuration.enableGradeRubric !== undefined) {
                    taskConfig.enableGradeRubric = updateTaskDto.configuration.enableGradeRubric;
                }

                if (updateTaskDto.configuration.rubricData !== undefined) {
                    taskConfig.rubricData = updateTaskDto.configuration.rubricData;
                }

                if (updateTaskDto.configuration.showOtherSubmissions !== undefined) {
                    taskConfig.showOtherSubmissions = updateTaskDto.configuration.showOtherSubmissions;
                }

                if (updateTaskDto.configuration.anonymizeSubmissions !== undefined) {
                    taskConfig.anonymizeSubmissions = updateTaskDto.configuration.anonymizeSubmissions;
                }

                if (updateTaskDto.configuration.enableGroupSubmission !== undefined) {
                    taskConfig.enableGroupSubmission = updateTaskDto.configuration.enableGroupSubmission;
                }

                if (updateTaskDto.configuration.maxGroupSize !== undefined) {
                    taskConfig.maxGroupSize = updateTaskDto.configuration.maxGroupSize;
                }

                if (updateTaskDto.configuration.enableVersionControl !== undefined) {
                    taskConfig.enableVersionControl = updateTaskDto.configuration.enableVersionControl;
                }

                if (updateTaskDto.configuration.lockAfterGrade !== undefined) {
                    taskConfig.lockAfterGrade = updateTaskDto.configuration.lockAfterGrade;
                }

                if (updateTaskDto.configuration.metadata !== undefined) {
                    taskConfig.metadata = {
                        ...taskConfig.metadata,
                        ...updateTaskDto.configuration.metadata
                    };
                }

                await this.taskConfigRepository.save(taskConfig);
            }

            // ==================== CARGAR TAREA CON RELACIONES ====================
            const taskWithRelations = await this.taskRepository.findOne({
                where: { id: updatedTask.id },
                relations: ['configuration', 'course', 'creator']
            });

            if (!taskWithRelations) {
                throw new InternalServerErrorException(
                    'Error al recuperar la tarea actualizada'
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
            console.error('Error al actualizar tarea:', error);

            // Lanzar excepción genérica
            throw new InternalServerErrorException(
                'Error al actualizar la tarea. Por favor, inténtalo de nuevo.'
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

    async getById(idtask: string, tenantId: string): Promise<Task> {
        try {
            const task = await this.taskRepository.findOne({
                where: { 
                    id: idtask,
                    tenantId 
                },
                relations: ['configuration', 'submissions', 'attachments']
            });

            if (!task) {
                throw new BadRequestException('Tarea no encontrada');
            }

            return task;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            console.error('Error obteniendo tarea por ID:', error);
            throw new InternalServerErrorException('Error interno obteniendo la tarea');
        }
    }
}

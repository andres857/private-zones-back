import { Controller, Get, Post, Body, Patch, Param, Delete, Req, BadRequestException, NotFoundException, InternalServerErrorException, Query, DefaultValuePipe, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post('/create')
  async createTask(
      @Req() request: AuthenticatedRequest, 
      @Body() body: CreateTaskDto
  ) {
      try {
          // Opcional: Asignar automáticamente el createdBy desde el usuario autenticado
          if (request.user?.id && !body.createdBy) {
              body.createdBy = request.user.id;
          }

          const savedTask = await this.tasksService.createTask(body);

          // Retornar respuesta exitosa
          return {
              success: true,
              message: 'Tarea creada exitosamente',
              data: {
              id: savedTask.id,
              title: savedTask.title,
              description: savedTask.description,
              instructions: savedTask.instructions,
              status: savedTask.status,
              courseId: savedTask.courseId,
              startDate: savedTask.startDate,
              endDate: savedTask.endDate,
              lateSubmissionDate: savedTask.lateSubmissionDate,
              maxPoints: savedTask.maxPoints,
              maxFileUploads: savedTask.maxFileUploads,
              maxFileSize: savedTask.maxFileSize,
              allowedFileTypes: savedTask.allowedFileTypes,
              order: savedTask.order,
              configuration: savedTask.configuration,
              createdAt: savedTask.createdAt
              }
          };
      } catch (error) {
          // Si es BadRequestException, NotFoundException o InternalServerErrorException, 
          // dejar que NestJS lo maneje
          if (
              error instanceof BadRequestException || 
              error instanceof NotFoundException ||
              error instanceof InternalServerErrorException
          ) {
              throw error;
          }

          // Log del error
          console.error('Error en endpoint createTask:', error);

          // Retornar error genérico
          throw new InternalServerErrorException('Error al procesar la solicitud');
      }
  }

  @Get('/course/:courseId')
  async getAllForums(
    @Req() request: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
  ) {
    try {
      const userId = request.user?.['id'];
      const tenantId = request.tenant?.id;

      if (!userId) {
        throw new BadRequestException('Usuario no autenticado');
      }

      if (!tenantId) {
        throw new BadRequestException('Tenant no validado');
      }

      const validPage = Math.max(1, page || 1);
      const validLimit = Math.min(Math.max(1, limit || 12), 20);

      const result = await this.tasksService.getAll({
        courseId,
        search,
        page: validPage,
        limit: validLimit,
        tenantId,
      });

      return {
        success: true,
        message: 'Tareas obtenidas exitosamente',
        data: result.data,
        pagination: result.pagination,
        stats: result.stats,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo tareas:', error);
      throw new InternalServerErrorException('Error interno obteniendo los tareas');
    }
  }

  @Get('/:id')
  async getTaskById(@Req() request: AuthenticatedRequest, @Param('id') idTask: string) {
    try {
      console.log(`Obteniendo tarea por ID: ${idTask}`);
      const tenantId = request.tenant?.id;

      if (!tenantId) {
          throw new BadRequestException('Tenant no validado');
      }

      const task = await this.tasksService.getById(idTask, tenantId);

      return {
          success: true,
          message: 'Tarea obtenido exitosamente',
          data: task
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.tasksService.findOne(+id);
  // }

  @Patch('/update/:id')
  async updateTask(
      @Req() request: AuthenticatedRequest,
      @Param('id') taskId: string,
      @Body() updateTaskDto: UpdateTaskDto
  ) {
    try {
      const tenantId = request.tenant?.id;
      const userId = request.user?.id;

      if (!tenantId) {
        throw new BadRequestException('Tenant no validado');
      }

      if (!userId) {
        throw new BadRequestException('Usuario no autenticado');
      }

      // Validar que la tarea existe y pertenece al tenant
      const existingTask = await this.tasksService.getById(taskId, tenantId);

      if (!existingTask) {
        throw new NotFoundException('Tarea no encontrada');
      }

      // Actualizar la tarea
      const updatedTask = await this.tasksService.updateTask(
        taskId,
        tenantId,
        updateTaskDto
      );

      return {
        success: true,
        message: 'Tarea actualizada exitosamente',
        data: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          instructions: updatedTask.instructions,
          status: updatedTask.status,
          courseId: updatedTask.courseId,
          startDate: updatedTask.startDate,
          endDate: updatedTask.endDate,
          lateSubmissionDate: updatedTask.lateSubmissionDate,
          maxPoints: updatedTask.maxPoints,
          lateSubmissionPenalty: updatedTask.lateSubmissionPenalty,
          maxFileUploads: updatedTask.maxFileUploads,
          maxFileSize: updatedTask.maxFileSize,
          allowedFileTypes: updatedTask.allowedFileTypes,
          allowMultipleSubmissions: updatedTask.allowMultipleSubmissions,
          maxSubmissionAttempts: updatedTask.maxSubmissionAttempts,
          requireSubmission: updatedTask.requireSubmission,
          enablePeerReview: updatedTask.enablePeerReview,
          showGradeToStudent: updatedTask.showGradeToStudent,
          showFeedbackToStudent: updatedTask.showFeedbackToStudent,
          notifyOnSubmission: updatedTask.notifyOnSubmission,
          order: updatedTask.order,
          configuration: updatedTask.configuration,
          updatedAt: updatedTask.updatedAt
        }
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      console.error('Error en endpoint updateTask:', error);
      throw new InternalServerErrorException('Error al procesar la solicitud');
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}

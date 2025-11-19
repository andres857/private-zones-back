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

  @Post('/create/task')
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
          message: 'Foros obtenidos exitosamente',
          data: result.data,
          pagination: result.pagination,
          stats: result.stats,
      };
  } catch (error) {
      if (error instanceof BadRequestException) {
      throw error;
      }
      console.error('Error obteniendo foros:', error);
      throw new InternalServerErrorException('Error interno obteniendo los foros');
  }
}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}

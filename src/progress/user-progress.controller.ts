// src/progress/controllers/user-progress.controller.ts
import {
  Controller, Get, Post, Put, Param, Body, Query, 
  UseGuards, Req, BadRequestException, NotFoundException,
  HttpStatus, HttpCode
} from '@nestjs/common';
import { 
  ApiTags, ApiOperation, ApiResponse, ApiParam, 
  ApiQuery, ApiBearerAuth, ApiBody 
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserProgressService } from './services/user-progress.service';
import { CompleteItemDto } from './dto/complete-item.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { ProgressSummaryDto } from './dto/progress-summary.dto';
import { StudyTimeStatsDto } from './dto/study-time-stats.dto';
import { GetActivityLogDto, ActivityLogDto } from '../users/dto/activity-log.dto';
import { SessionDto } from './dto/session.dto';
import { UserCourseListDto } from './dto/user-course-list.dto';

@ApiTags('User Progress')
@Controller('user-progress')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserProgressController {
  constructor(private readonly progressService: UserProgressService) {}

  /**
   * Inicializa el progreso de un usuario en un curso
   */
  @Post('courses/:courseId/initialize')
  @ApiOperation({ 
    summary: 'Inicializar progreso en curso',
    description: 'Inicializa todas las entidades de progreso para un usuario en un curso específico'
  })
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiResponse({ 
    status: 201, 
    description: 'Progreso inicializado correctamente',
    type: ProgressSummaryDto
  })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  @HttpCode(HttpStatus.CREATED)
  async initializeCourseProgress(
    @Param('courseId') courseId: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const courseProgress = await this.progressService.initializeCourseProgress(userId, courseId);
    
    return {
      message: 'Course progress initialized successfully',
      data: courseProgress
    };
  }

  /**
   * Obtiene el resumen de progreso de un usuario en un curso
   */
  @Get('courses/:courseId/summary')
  @ApiOperation({
    summary: 'Obtener resumen de progreso',
    description: 'Obtiene el progreso completo del usuario en un curso incluyendo módulos e items'
  })
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumen de progreso obtenido correctamente',
    type: ProgressSummaryDto
  })
  async getProgressSummary(
    @Param('courseId') courseId: string,
    @Req() req: any
  ): Promise<ProgressSummaryDto> {
    const userId = req.user.id;
    return await this.progressService.getProgressSummary(userId, courseId);
  }

  /**
   * Marca un item como completado
   */
  @Put('items/:itemId/complete')
  @ApiOperation({
    summary: 'Completar item',
    description: 'Marca un item como completado y actualiza el progreso en cascada'
  })
  @ApiParam({ name: 'itemId', description: 'ID del item a completar' })
  @ApiBody({ type: CompleteItemDto })
  @ApiResponse({ status: 200, description: 'Item completado correctamente' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  async completeItem(
    @Param('itemId') itemId: string,
    @Body() completeItemDto: CompleteItemDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    await this.progressService.completeItem(userId, itemId, completeItemDto);
    
    return {
      message: 'Item completed successfully',
      itemId,
      completionData: completeItemDto
    };
  }

  /**
   * Actualiza el progreso de un item (para items con progreso parcial)
   */
  @Put('items/:itemId/progress')
  @ApiOperation({
    summary: 'Actualizar progreso parcial',
    description: 'Actualiza el progreso de un item sin marcarlo como completado'
  })
  @ApiParam({ name: 'itemId', description: 'ID del item' })
  async updateItemProgress(
    @Param('itemId') itemId: string,
    @Body() body: { progressPercentage: number; timeSpent?: number },
    @Req() req: any
  ) {
    const userId = req.user.id;
    
    if (body.progressPercentage < 0 || body.progressPercentage > 100) {
      throw new BadRequestException('Progress percentage must be between 0 and 100');
    }

    await this.progressService.updateItemProgress(
      userId, 
      itemId, 
      body.progressPercentage, 
      body.timeSpent
    );

    return {
      message: 'Item progress updated successfully',
      itemId,
      progressPercentage: body.progressPercentage
    };
  }

  /**
   * Inicia una sesión de estudio
   */
  @Post('sessions/start')
  @ApiOperation({
    summary: 'Iniciar sesión de estudio',
    description: 'Inicia una nueva sesión de estudio y finaliza las sesiones activas previas'
  })
  @ApiBody({ type: StartSessionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Sesión iniciada correctamente',
    type: SessionDto
  })
  async startSession(
    @Body() startSessionDto: StartSessionDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const { courseId, moduleId, itemId, ipAddress, userAgent } = startSessionDto;
    
    const session = await this.progressService.startSession(
      userId, courseId, moduleId, itemId, ipAddress, userAgent
    );

    return {
      message: 'Session started successfully',
      session
    };
  }

  /**
   * Finaliza una sesión de estudio
   */
  @Put('sessions/:sessionId/end')
  @ApiOperation({
    summary: 'Finalizar sesión de estudio',
    description: 'Finaliza una sesión activa y calcula el tiempo total'
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la sesión' })
  @ApiResponse({ status: 200, description: 'Sesión finalizada correctamente' })
  async endSession(@Param('sessionId') sessionId: string) {
    await this.progressService.endSession(sessionId);
    
    return { 
      message: 'Session ended successfully',
      sessionId 
    };
  }

  /**
   * Finaliza todas las sesiones activas del usuario
   */
  @Put('sessions/end-all')
  @ApiOperation({
    summary: 'Finalizar todas las sesiones activas',
    description: 'Finaliza todas las sesiones activas del usuario autenticado'
  })
  async endAllSessions(@Req() req: any) {
    const userId = req.user.id;
    await this.progressService.endAllUserSessions(userId);
    
    return { message: 'All active sessions ended successfully' };
  }

  /**
   * Obtiene estadísticas de tiempo de estudio
   */
  @Get('study-time-stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de tiempo de estudio',
    description: 'Obtiene métricas de tiempo de estudio del usuario'
  })
  @ApiQuery({ 
    name: 'courseId', 
    required: false, 
    description: 'ID del curso para filtrar estadísticas' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas correctamente',
    type: StudyTimeStatsDto
  })
  async getStudyTimeStats(
    @Req() req: any,
    @Query('courseId') courseId?: string,
  ): Promise<StudyTimeStatsDto> {
    const userId = req.user.id;
    return await this.progressService.getStudyTimeStats(userId, courseId);
  }

  /**
   * Obtiene el progreso de todos los cursos del usuario
   */
  @Get('courses')
  @ApiOperation({
    summary: 'Listar progreso de todos los cursos',
    description: 'Obtiene el progreso del usuario en todos sus cursos'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de progreso obtenida correctamente',
    type: UserCourseListDto
  })
  async getAllCourseProgress(@Req() req: any): Promise<UserCourseListDto> {
    const userId = req.user.id;
    return await this.progressService.getAllCourseProgress(userId);
  }

  /**
   * Obtiene el historial de actividades del usuario
   */
  @Get('activity-log')
  @ApiOperation({
    summary: 'Obtener historial de actividades',
    description: 'Obtiene el log de actividades del usuario con paginación y filtros'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (max 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  @ApiQuery({ name: 'activityType', required: false, description: 'Filtrar por tipo de actividad' })
  @ApiQuery({ name: 'referenceId', required: false, description: 'Filtrar por ID de referencia' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial obtenido correctamente',
    type: [ActivityLogDto]
  })
  async getActivityLog(
    @Query() queryParams: GetActivityLogDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const { limit = 50, offset = 0, activityType, referenceId } = queryParams;
    
    const result = await this.progressService.getActivityLog(
      userId, 
      { limit, offset, activityType, referenceId }
    );

    return {
      data: result.data,
      pagination: {
        limit,
        offset,
        total: result.total,
        hasMore: offset + limit < result.total
      }
    };
  }

  /**
   * Reinicia el progreso de un usuario en un curso
   */
  @Post('courses/:courseId/reset')
  @ApiOperation({
    summary: 'Reiniciar progreso del curso',
    description: 'Reinicia completamente el progreso del usuario en un curso'
  })
  @ApiParam({ name: 'courseId', description: 'ID del curso a reiniciar' })
  @ApiResponse({ status: 200, description: 'Progreso reiniciado correctamente' })
  async resetCourseProgress(
    @Param('courseId') courseId: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    await this.progressService.resetCourseProgress(userId, courseId);
    
    return {
      message: 'Course progress reset successfully',
      courseId,
      resetAt: new Date()
    };
  }

  /**
   * Obtiene el dashboard de progreso del usuario
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard de progreso',
    description: 'Obtiene un resumen ejecutivo del progreso del usuario'
  })
  @ApiResponse({ status: 200, description: 'Dashboard obtenido correctamente' })
  async getDashboard(@Req() req: any) {
    const userId = req.user.id;
    const dashboard = await this.progressService.getUserDashboard(userId);
    
    return dashboard;
  }

  /**
   * Obtiene sesiones activas del usuario
   */
  @Get('sessions/active')
  @ApiOperation({
    summary: 'Obtener sesiones activas',
    description: 'Obtiene todas las sesiones activas del usuario'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesiones activas obtenidas',
    type: [SessionDto]
  })
  async getActiveSessions(@Req() req: any) {
    const userId = req.user.id;
    const sessions = await this.progressService.getActiveSessions(userId);
    
    return {
      data: sessions,
      count: sessions.length
    };
  }

  /**
   * Obtiene estadísticas de rendimiento por módulo
   */
  @Get('courses/:courseId/module-stats')
  @ApiOperation({
    summary: 'Estadísticas por módulo',
    description: 'Obtiene estadísticas detalladas de rendimiento por módulo'
  })
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  async getModuleStats(
    @Param('courseId') courseId: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const stats = await this.progressService.getModuleStats(userId, courseId);
    
    return {
      courseId,
      moduleStats: stats
    };
  }

  /**
   * Verifica si el usuario puede acceder a un módulo
   */
  @Get('modules/:moduleId/access-check')
  @ApiOperation({
    summary: 'Verificar acceso a módulo',
    description: 'Verifica si el usuario puede acceder a un módulo específico'
  })
  @ApiParam({ name: 'moduleId', description: 'ID del módulo' })
  async checkModuleAccess(
    @Param('moduleId') moduleId: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const accessInfo = await this.progressService.checkModuleAccess(userId, moduleId);
    
    return accessInfo;
  }
}
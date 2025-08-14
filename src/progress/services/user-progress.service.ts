// src/progress/services/user-progress.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserCourseProgress, CourseStatus } from '../entities/user-course-progress.entity';
import { UserModuleProgress, ModuleStatus } from '../entities/user-module-progress.entity';
import { UserItemProgress, ItemStatus } from '../entities/user-item-progress.entity';
import { UserActivityLog, ActivityType } from '../../users/entities/user-activity-log.entity';
import { UserSession } from '../entities/user-session.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';
import { ModuleItem, ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';
import { ContentItem } from 'src/contents/entities/courses-contents.entity';

export interface ProgressSummary {
  courseProgress: UserCourseProgress;
  moduleProgress: UserModuleProgress[];
  itemProgress: UserItemProgress[];
  completionStats: {
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
    totalModules: number;
    completedModules: number;
    averageScore: number;
  };
}

export interface ItemCompletionData {
  score?: number;
  timeSpent?: number;
  responses?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserCourseProgress)
    private courseProgressRepo: Repository<UserCourseProgress>,
    @InjectRepository(UserModuleProgress)
    private moduleProgressRepo: Repository<UserModuleProgress>,
    @InjectRepository(UserItemProgress)
    private itemProgressRepo: Repository<UserItemProgress>,
    @InjectRepository(UserActivityLog)
    private activityLogRepo: Repository<UserActivityLog>,
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
    @InjectRepository(Courses)
    private coursesRepo: Repository<Courses>,
    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,
    @InjectRepository(ModuleItem)
    private itemRepo: Repository<ModuleItem>,
    @InjectRepository(ContentItem)
    private contentItemRepo: Repository<ContentItem>,
    private dataSource: DataSource,
  ) {}

  /**
   * Inicializa el progreso de un usuario en un curso
   */
  async initializeCourseProgress(userId: string, courseId: string): Promise<UserCourseProgress> {
    // Verificar si ya existe progreso
    let courseProgress = await this.courseProgressRepo.findOne({
      where: { userId, courseId }
    });

    if (courseProgress) {
      return courseProgress;
    }

    // Obtener información del curso
    const course = await this.coursesRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.items']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Calcular totales
    const totalModules = course.modules.length;
    const totalItems = course.modules.reduce((acc, module) => acc + module.items.length, 0);

    // Crear progreso del curso
    courseProgress = this.courseProgressRepo.create({
      userId,
      courseId,
      status: CourseStatus.NOT_STARTED,
      totalModules,
      totalItems,
      started_at: new Date()
    });

    await this.courseProgressRepo.save(courseProgress);

    // Inicializar progreso de módulos
    for (const module of course.modules) {
      await this.initializeModuleProgress(userId, module.id);
    }

    // Registrar actividad
    await this.logActivity(userId, ActivityType.COURSE_STARTED, courseId, 'course');

    return courseProgress;
  }

  /**
   * Inicializa el progreso de un usuario en un módulo
   */
  async initializeModuleProgress(userId: string, moduleId: string): Promise<UserModuleProgress> {
    let moduleProgress = await this.moduleProgressRepo.findOne({
      where: { userId, moduleId }
    });

    if (moduleProgress) {
      return moduleProgress;
    }

    const module = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['items']
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    moduleProgress = this.moduleProgressRepo.create({
      userId,
      moduleId,
      status: ModuleStatus.NOT_STARTED,
      totalItems: module.items.length
    });

    await this.moduleProgressRepo.save(moduleProgress);

    // Inicializar progreso de items
    for (const item of module.items) {
      await this.initializeItemProgress(userId, item.id);
    }

    return moduleProgress;
  }

  /**
   * Inicializa el progreso de un usuario en un item
   */
  async initializeItemProgress(userId: string, itemId: string): Promise<UserItemProgress> {
    let itemProgress = await this.itemProgressRepo.findOne({
      where: { userId, itemId }
    });

    if (itemProgress) {
      return itemProgress;
    }

    itemProgress = this.itemProgressRepo.create({
      userId,
      itemId,
      status: ItemStatus.NOT_STARTED
    });

    return await this.itemProgressRepo.save(itemProgress);
  }

  /**
   * Marca un item como completado y actualiza el progreso en cascada
   */
  async completeItem(
    userId: string, 
    itemId: string, 
    completionData: ItemCompletionData = {}
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Actualizar progreso del item
      const itemProgress = await queryRunner.manager.findOne(UserItemProgress, {
        where: { userId, itemId },
        relations: ['item', 'item.module']
      });

      if (!itemProgress) {
        throw new NotFoundException('Item progress not found');
      }

      // Actualizar item progress
      itemProgress.status = ItemStatus.COMPLETED;
      itemProgress.completed_at = new Date();
      itemProgress.lastAccessedAt = new Date();
      
      if (completionData.score !== undefined) {
        itemProgress.score = completionData.score;
        itemProgress.updateBestScore(completionData.score);
      }
      
      if (completionData.timeSpent !== undefined) {
        itemProgress.timeSpent += completionData.timeSpent;
      }
      
      if (completionData.responses) {
        itemProgress.responses = completionData.responses;
      }
      
      if (completionData.metadata) {
        itemProgress.metadata = { ...itemProgress.metadata, ...completionData.metadata };
      }

      await queryRunner.manager.save(itemProgress);

      // Actualizar progreso del módulo
      await this.updateModuleProgress(userId, itemProgress.item.module.id, queryRunner.manager);

      // Actualizar progreso del curso
      const module = await queryRunner.manager.findOne(CourseModule, {
        where: { id: itemProgress.item.module.id }
      });

      if (!module) {
        throw new NotFoundException('Module not found');
      }
      
      await this.updateCourseProgress(userId, module.courseId, queryRunner.manager);

      // Registrar actividad
      await this.logActivity(
        userId, 
        ActivityType.ITEM_COMPLETED, 
        itemId, 
        'item',
        completionData
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualiza el progreso de un módulo basado en el progreso de sus items
   */
  private async updateModuleProgress(
    userId: string, 
    moduleId: string, 
    manager?: any
  ): Promise<void> {
    const repo = manager || this.moduleProgressRepo;
    const itemRepo = manager ? manager.getRepository(UserItemProgress) : this.itemProgressRepo;

    const moduleProgress = await repo.findOne({
      where: { userId, moduleId }
    });

    if (!moduleProgress) return;

    // Obtener progreso de todos los items del módulo
    const itemProgresses = await itemRepo
    .createQueryBuilder('itemProgress')
    .leftJoinAndSelect('itemProgress.item', 'item')
    .where('itemProgress.userId = :userId', { userId })
    .andWhere('item.moduleId = :moduleId', { moduleId })
    .getMany();

    const completedItems = itemProgresses.filter(ip => ip.isCompleted()).length;
    const totalItems = itemProgresses.length;
    
    // Calcular progreso y puntuación promedio
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const scores = itemProgresses
      .filter(ip => ip.score !== null)
      .map(ip => ip.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Determinar estado del módulo
    let status = ModuleStatus.NOT_STARTED;
    if (completedItems > 0 && completedItems < totalItems) {
      status = ModuleStatus.IN_PROGRESS;
    } else if (completedItems === totalItems && totalItems > 0) {
      status = ModuleStatus.COMPLETED;
      moduleProgress.completed_at = new Date();
      
      // Registrar actividad de módulo completado
      await this.logActivity(userId, ActivityType.MODULE_COMPLETED, moduleId, 'module');
    }

    // Actualizar progreso del módulo
    moduleProgress.status = status;
    moduleProgress.progressPercentage = progressPercentage;
    moduleProgress.scorePercentage = averageScore;
    moduleProgress.itemsCompleted = completedItems;
    moduleProgress.totalItems = totalItems;
    moduleProgress.lastAccessedAt = new Date();

    await repo.save(moduleProgress);
  }

  /**
   * Actualiza el progreso de un curso basado en el progreso de sus módulos
   */
  private async updateCourseProgress(
    userId: string, 
    courseId: string, 
    manager?: any
  ): Promise<void> {
    const repo = manager || this.courseProgressRepo;
    const moduleRepo = manager ? manager.getRepository(UserModuleProgress) : this.moduleProgressRepo;

    const courseProgress = await repo.findOne({
      where: { userId, courseId }
    });

    if (!courseProgress) return;

    // Obtener progreso de todos los módulos del curso
    const moduleProgresses = await moduleRepo
    .createQueryBuilder('moduleProgress')
    .leftJoinAndSelect('moduleProgress.module', 'module')
    .where('moduleProgress.userId = :userId', { userId })
    .andWhere('module.courseId = :courseId', { courseId })
    .getMany();


    const completedModules = moduleProgresses.filter(mp => mp.isCompleted()).length;
    const totalModules = moduleProgresses.length;

    // Calcular items completados
    const totalItemsCompleted = moduleProgresses.reduce((acc, mp) => acc + mp.itemsCompleted, 0);
    const totalItems = moduleProgresses.reduce((acc, mp) => acc + mp.totalItems, 0);

    const progressPercentage = totalItems > 0 ? (totalItemsCompleted / totalItems) * 100 : 0;
    
    // Calcular puntuación promedio del curso
    const moduleScores = moduleProgresses
      .filter(mp => mp.scorePercentage > 0)
      .map(mp => mp.scorePercentage);
    const averageScore = moduleScores.length > 0 ? 
      moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length : 0;

    // Determinar estado del curso
    let status = CourseStatus.NOT_STARTED;
    if (totalItemsCompleted > 0 && completedModules < totalModules) {
      status = CourseStatus.IN_PROGRESS;
    } else if (completedModules === totalModules && totalModules > 0) {
      status = CourseStatus.COMPLETED;
      courseProgress.completed_at = new Date();
      
      // Registrar actividad de curso completado
      await this.logActivity(userId, ActivityType.COURSE_COMPLETED, courseId, 'course');
    }

    // Actualizar progreso del curso
    courseProgress.status = status;
    courseProgress.progressPercentage = progressPercentage;
    courseProgress.scorePercentage = averageScore;
    courseProgress.totalModulesCompleted = completedModules;
    courseProgress.totalItemsCompleted = totalItemsCompleted;
    courseProgress.lastAccessedAt = new Date();

    await repo.save(courseProgress);
  }

  /**
   * Obtiene el resumen completo de progreso de un usuario en un curso
   */
  async getProgressSummary(userId: string, courseId: string): Promise<ProgressSummary> {
    const courseProgress = await this.courseProgressRepo.findOne({
      where: { userId, courseId }
    });

    if (!courseProgress) {
      throw new NotFoundException('Course progress not found');
    }

    // Obtener progreso de módulos
    const moduleProgress = await this.moduleProgressRepo
    .createQueryBuilder('moduleProgress')
    .leftJoinAndSelect('moduleProgress.module', 'module')
    .where('moduleProgress.userId = :userId', { userId })
    .andWhere('module.courseId = :courseId', { courseId })
    .getMany();


    // Obtener progreso de items
    const itemProgress = await this.itemProgressRepo
    .createQueryBuilder('itemProgress')
    .leftJoinAndSelect('itemProgress.item', 'item')
    .leftJoinAndSelect('item.module', 'module')
    .where('itemProgress.userId = :userId', { userId })
    .andWhere('module.courseId = :courseId', { courseId })
    .getMany();

    // Calcular estadísticas
    const completedItems = itemProgress.filter(ip => ip.isCompleted()).length;
    const completedModules = moduleProgress.filter(mp => mp.isCompleted()).length;
    const scores = itemProgress.filter(ip => ip.score !== null).map(ip => ip.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      courseProgress,
      moduleProgress,
      itemProgress,
      completionStats: {
        totalItems: itemProgress.length,
        completedItems,
        progressPercentage: courseProgress.progressPercentage,
        totalModules: moduleProgress.length,
        completedModules,
        averageScore
      }
    };
  }

  /**
   * Inicia una nueva sesión de usuario
   */
  async startSession(
    userId: string, 
    courseId?: string, 
    moduleId?: string, 
    itemId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    // Finalizar sesiones activas
    await this.sessionRepo.update(
      { userId, isActive: true },
      { isActive: false, endTime: new Date() }
    );

    const session = this.sessionRepo.create({
      userId,
      courseId,
      moduleId,
      itemId,
      startTime: new Date(),
      ipAddress,
      userAgent
    });

    return await this.sessionRepo.save(session);
  }

  /**
   * Finaliza una sesión de usuario
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, isActive: true }
    });

    if (session) {
      session.endSession();
      await this.sessionRepo.save(session);
    }
  }

  /**
   * Registra una actividad del usuario
   */
  async logActivity(
    userId: string,
    activityType: ActivityType,
    referenceId?: string,
    referenceType?: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserActivityLog> {
    const log = this.activityLogRepo.create({
      userId,
      activityType,
      referenceId,
      referenceType,
      details,
      ipAddress,
      userAgent
    });

    return await this.activityLogRepo.save(log);
  }

  /**
   * Actualiza el progreso parcial de un item
   */
  async updateItemProgress(
    itemId: string,
    userId: string,
    progressPercentage: number,
    timeSpent?: number
  ): Promise<void> {

    const contentItem = await this.itemRepo.findOne({where: {referenceId: itemId}});

    // console.log('contentItem', contentItem);
    // console.log('itemId', itemId);

    if(!contentItem){
      throw new NotFoundException('ups, parece que con se contro el contenido');
    }

    const itemProgress = await this.itemProgressRepo.findOne({
      where: { userId: userId, itemId: contentItem.id }
    });

    // console.log('itemProgress', itemProgress)

    if (!itemProgress) {
      throw new NotFoundException('Item progress not found');
    }

    // console.log('PROGRESO: ', progressPercentage);
    itemProgress.progressPercentage = progressPercentage;
    itemProgress.lastAccessedAt = new Date();
    
    if (timeSpent) {
      itemProgress.timeSpent += timeSpent;
    }

    // Si alcanza 100%, marcar como completado
    if (progressPercentage >= 97 && itemProgress.status !== ItemStatus.COMPLETED) {
      itemProgress.status = ItemStatus.COMPLETED;
      itemProgress.attempts += 1;
      itemProgress.completed_at = new Date();
    } else if (progressPercentage > 0 && itemProgress.status === ItemStatus.NOT_STARTED) {
      itemProgress.status = ItemStatus.IN_PROGRESS;
      itemProgress.started_at = new Date();
    }

    await this.itemProgressRepo.save(itemProgress);
  }

  /**
   * Finaliza todas las sesiones activas del usuario
   */
  async endAllUserSessions(userId: string): Promise<void> {
    const activeSessions = await this.sessionRepo.find({
      where: { userId, isActive: true }
    });

    for (const session of activeSessions) {
      session.endSession();
    }

    if (activeSessions.length > 0) {
      await this.sessionRepo.save(activeSessions);
    }
  }

  /**
   * Obtiene todas las sesiones activas del usuario
   */
  async getActiveSessions(userId: string): Promise<UserSession[]> {
    return await this.sessionRepo.find({
      where: { userId, isActive: true },
      order: { startTime: 'DESC' }
    });
  }

  /**
   * Obtiene el progreso de todos los cursos del usuario
   */
  async getAllCourseProgress(userId: string): Promise<{
    courses: any[];
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
  }> {
    const courseProgresses = await this.courseProgressRepo.find({
      where: { userId },
      relations: ['course', 'course.translations'],
      order: { lastAccessedAt: 'DESC' }
    });

    const courses = courseProgresses.map(cp => ({
      courseId: cp.courseId,
      courseTitle: cp.course.getTranslatedTitle('es'),
      courseSlug: cp.course.slug,
      status: cp.status,
      progressPercentage: cp.progressPercentage,
      scorePercentage: cp.scorePercentage,
      started_at: cp.started_at,
      completed_at: cp.completed_at,
      lastAccessedAt: cp.lastAccessedAt
    }));

    const completedCourses = courseProgresses.filter(cp => cp.status === CourseStatus.COMPLETED).length;
    const inProgressCourses = courseProgresses.filter(cp => cp.status === CourseStatus.IN_PROGRESS).length;

    return {
      courses,
      totalCourses: courseProgresses.length,
      completedCourses,
      inProgressCourses
    };
  }

  /**
   * Obtiene el historial de actividades del usuario
   */
  async getActivityLog(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      activityType?: ActivityType;
      referenceId?: string;
    } = {}
  ): Promise<{ data: UserActivityLog[]; total: number }> {
    const { limit = 50, offset = 0, activityType, referenceId } = options;

    const query = this.activityLogRepo.createQueryBuilder('log')
      .where('log.userId = :userId', { userId });

    if (activityType) {
      query.andWhere('log.activityType = :activityType', { activityType });
    }

    if (referenceId) {
      query.andWhere('log.referenceId = :referenceId', { referenceId });
    }

    const [data, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Reinicia el progreso completo de un usuario en un curso
   */
  async resetCourseProgress(userId: string, courseId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Eliminar progreso de items
      await queryRunner.manager.delete(UserItemProgress, {
        userId,
        item: {
          module: {
            courseId
          }
        }
      });

      // Eliminar progreso de módulos
      await queryRunner.manager.delete(UserModuleProgress, {
        userId,
        module: {
          courseId
        }
      });

      // Eliminar progreso de curso
      await queryRunner.manager.delete(UserCourseProgress, {
        userId,
        courseId
      });

      // Finalizar sesiones activas del curso
      await queryRunner.manager.update(
        UserSession,
        { userId, courseId, isActive: true },
        { isActive: false, endTime: new Date() }
      );

      // Registrar actividad de reset
      await this.logActivity(userId, ActivityType.COURSE_STARTED, courseId, 'course', {
        action: 'reset',
        resetAt: new Date()
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene el dashboard ejecutivo del usuario
   */
  async getUserDashboard(userId: string): Promise<{
    summary: {
      totalCourses: number;
      completedCourses: number;
      inProgressCourses: number;
      totalStudyTime: number;
      averageScore: number;
    };
    recentActivity: UserActivityLog[];
    currentSessions: UserSession[];
    upcomingDeadlines: any[];
    achievements: any[];
  }> {
    // Resumen general
    const courseProgresses = await this.courseProgressRepo.find({
      where: { userId }
    });

    const completedCourses = courseProgresses.filter(cp => cp.status === CourseStatus.COMPLETED).length;
    const inProgressCourses = courseProgresses.filter(cp => cp.status === CourseStatus.IN_PROGRESS).length;
    const totalStudyTime = courseProgresses.reduce((acc, cp) => acc + cp.totalTimeSpent, 0);
    const scores = courseProgresses.filter(cp => cp.scorePercentage > 0).map(cp => cp.scorePercentage);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Actividad reciente
    const recentActivity = await this.activityLogRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10
    });

    // Sesiones activas
    const currentSessions = await this.getActiveSessions(userId);

    return {
      summary: {
        totalCourses: courseProgresses.length,
        completedCourses,
        inProgressCourses,
        totalStudyTime,
        averageScore: Math.round(averageScore * 100) / 100
      },
      recentActivity,
      currentSessions,
      upcomingDeadlines: [], // TODO: Implementar cuando tengas deadlines
      achievements: [] // TODO: Implementar sistema de logros
    };
  }

  /**
   * Obtiene estadísticas detalladas por módulo
   */
  async getModuleStats(userId: string, courseId: string): Promise<Array<{
    moduleId: string;
    moduleTitle: string;
    status: ModuleStatus;
    progressPercentage: number;
    scorePercentage: number;
    timeSpent: number;
    itemsCompleted: number;
    totalItems: number;
    averageItemScore: number;
    strongestAreas: string[];
    weakestAreas: string[];
  }>> {
    const moduleProgresses = await this.moduleProgressRepo
    .createQueryBuilder('moduleProgress')
    .leftJoinAndSelect('moduleProgress.module', 'module')
    .where('moduleProgress.userId = :userId', { userId })
    .andWhere('module.courseId = :courseId', { courseId })
    .getMany();


    const stats: any[] = [];

    for (const moduleProgress of moduleProgresses) {
      const itemProgresses = await this.itemProgressRepo
      .createQueryBuilder('itemProgress')
      .leftJoinAndSelect('itemProgress.item', 'item')
      .where('itemProgress.userId = :userId', { userId })
      .andWhere('item.moduleId = :moduleId', { moduleId: moduleProgress.moduleId })
      .getMany();


      const itemScores = itemProgresses
        .filter(ip => ip.score !== null)
        .map(ip => ip.score);
      
      const averageItemScore = itemScores.length > 0 ? 
        itemScores.reduce((a, b) => a + b, 0) / itemScores.length : 0;

      // Identificar áreas fuertes y débiles (simplificado)
      const strongestAreas = itemProgresses
        .filter(ip => ip.score && ip.score >= 85)
        .map(ip => ip.item.type);

      const weakestAreas = itemProgresses
        .filter(ip => ip.score && ip.score < 70)
        .map(ip => ip.item.type);

      stats.push({
        moduleId: moduleProgress.moduleId,
        moduleTitle: moduleProgress.module.title,
        status: moduleProgress.status,
        progressPercentage: moduleProgress.progressPercentage,
        scorePercentage: moduleProgress.scorePercentage,
        timeSpent: moduleProgress.timeSpent,
        itemsCompleted: moduleProgress.itemsCompleted,
        totalItems: moduleProgress.totalItems,
        averageItemScore: Math.round(averageItemScore * 100) / 100,
        strongestAreas: [...new Set(strongestAreas)],
        weakestAreas: [...new Set(weakestAreas)]
      });
    }

    return stats;
  }

  /**
   * Verifica si el usuario puede acceder a un módulo
   */
  async checkModuleAccess(userId: string, moduleId: string): Promise<{
    canAccess: boolean;
    reason?: string;
    prerequisites?: string[];
    moduleInfo: {
      title: string;
      status: ModuleStatus;
      progressPercentage: number;
    };
  }> {
    const moduleProgress = await this.moduleProgressRepo.findOne({
      where: { userId, moduleId },
      relations: ['module']
    });

    if (!moduleProgress) {
      return {
        canAccess: false,
        reason: 'Module progress not found',
        moduleInfo: {
          title: '',
          status: ModuleStatus.NOT_STARTED,
          progressPercentage: 0
        }
      };
    }

    // Lógica básica de acceso - puedes expandir con prerequisitos más complejos
    const canAccess = true; // Por ahora todos los módulos son accesibles

    return {
      canAccess,
      moduleInfo: {
        title: moduleProgress.module.title,
        status: moduleProgress.status,
        progressPercentage: moduleProgress.progressPercentage
      }
    };
  }

  /**
   * Obtiene estadísticas de tiempo de estudio
   */
  async getStudyTimeStats(userId: string, courseId?: string): Promise<{
    totalTime: number;
    averageSessionTime: number;
    totalSessions: number;
    timeByModule: Record<string, number>;
  }> {
    const query = this.sessionRepo.createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.isActive = false');

    if (courseId) {
      query.andWhere('session.courseId = :courseId', { courseId });
    }

    const sessions = await query.getMany();

    const totalTime = sessions.reduce((acc, session) => acc + session.duration, 0);
    const averageSessionTime = sessions.length > 0 ? totalTime / sessions.length : 0;
    
    const timeByModule = sessions.reduce((acc, session) => {
      if (session.moduleId) {
        acc[session.moduleId] = (acc[session.moduleId] || 0) + session.duration;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTime,
      averageSessionTime,
      totalSessions: sessions.length,
      timeByModule
    };
  }

  async startItemProgress(contentId: string, userId: string): Promise<UserItemProgress> {
    // Encontrar el ModuleItem que referencia este contenido
    const moduleItem = await this.itemRepo.findOne({
      where: { referenceId: contentId, type: ModuleItemType.CONTENT },
      relations: ['module', 'module.course']
    });

    if (!moduleItem) {
      throw new Error('Module item not found for this content');
    }

    // Verificar si ya existe progreso
    let itemProgress = await this.itemProgressRepo.findOne({
      where: { userId, itemId: moduleItem.id }
    });

    if (!itemProgress) {
      itemProgress = this.itemProgressRepo.create({
        userId,
        itemId: moduleItem.id,
        status: ItemStatus.IN_PROGRESS,
        started_at: new Date(),
        lastAccessedAt: new Date()
      });
    } else {
      itemProgress.lastAccessedAt = new Date();
      if (itemProgress.status === ItemStatus.NOT_STARTED) {
        itemProgress.status = ItemStatus.IN_PROGRESS;
        itemProgress.started_at = new Date();
      }
    }

    return await this.itemProgressRepo.save(itemProgress);
  }

  // async updateItemProgress(contentId: string, userId: string, progressData: {
  //   progressPercentage?: number;
  //   timeSpent?: number;
  // }): Promise<UserItemProgress> {
  //   const moduleItem = await this.moduleItemRepository.findOne({
  //     where: { referenceId: contentId, type: 'content' }
  //   });

  //   if (!moduleItem) {
  //     throw new Error('Module item not found for this content');
  //   }

  //   const itemProgress = await this.userItemProgressRepository.findOne({
  //     where: { userId, itemId: moduleItem.id }
  //   });

  //   if (!itemProgress) {
  //     throw new Error('Item progress not found');
  //   }

  //   if (progressData.progressPercentage !== undefined) {
  //     itemProgress.progressPercentage = progressData.progressPercentage;
  //   }
    
  //   if (progressData.timeSpent !== undefined) {
  //     itemProgress.timeSpent += progressData.timeSpent;
  //   }

  //   itemProgress.lastAccessedAt = new Date();

  //   return await this.userItemProgressRepository.save(itemProgress);
  // }

  // async completeItem(contentId: string, userId: string): Promise<UserItemProgress> {
  //   const moduleItem = await this.moduleItemRepository.findOne({
  //     where: { referenceId: contentId, type: 'content' },
  //     relations: ['module', 'module.course']
  //   });

  //   if (!moduleItem) {
  //     throw new Error('Module item not found for this content');
  //   }

  //   let itemProgress = await this.userItemProgressRepository.findOne({
  //     where: { userId, itemId: moduleItem.id }
  //   });

  //   if (!itemProgress) {
  //     itemProgress = this.userItemProgressRepository.create({
  //       userId,
  //       itemId: moduleItem.id,
  //       status: ItemStatus.COMPLETED,
  //       started_at: new Date(),
  //       completed_at: new Date(),
  //       progressPercentage: 100
  //     });
  //   } else {
  //     itemProgress.status = ItemStatus.COMPLETED;
  //     itemProgress.completed_at = new Date();
  //     itemProgress.progressPercentage = 100;
  //   }

  //   await this.userItemProgressRepository.save(itemProgress);

  //   // Actualizar progreso del módulo y curso
  //   await this.updateModuleProgress(moduleItem.moduleId, userId);
  //   await this.updateCourseProgress(moduleItem.module.course.id, userId);

  //   return itemProgress;
  // }

  // private async updateModuleProgress(moduleId: string, userId: string): Promise<void> {
  //   // Obtener todos los items del módulo
  //   const moduleItems = await this.moduleItemRepository.find({
  //     where: { moduleId }
  //   });

  //   // Obtener progreso de todos los items
  //   const itemsProgress = await this.userItemProgressRepository.find({
  //     where: { 
  //       userId, 
  //       itemId: moduleItems.map(item => item.id).includes
  //     }
  //   });

  //   const completedItems = itemsProgress.filter(progress => progress.isCompleted()).length;
  //   const totalItems = moduleItems.length;
  //   const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  //   let moduleProgress = await this.userModuleProgressRepository.findOne({
  //     where: { userId, moduleId }
  //   });

  //   if (!moduleProgress) {
  //     moduleProgress = this.userModuleProgressRepository.create({
  //       userId,
  //       moduleId,
  //       status: progressPercentage === 100 ? ModuleStatus.COMPLETED : ModuleStatus.IN_PROGRESS,
  //       progressPercentage,
  //       itemsCompleted: completedItems,
  //       totalItems
  //     });
  //   } else {
  //     moduleProgress.progressPercentage = progressPercentage;
  //     moduleProgress.itemsCompleted = completedItems;
  //     moduleProgress.totalItems = totalItems;
  //     moduleProgress.status = progressPercentage === 100 ? ModuleStatus.COMPLETED : ModuleStatus.IN_PROGRESS;
      
  //     if (progressPercentage === 100) {
  //       moduleProgress.completed_at = new Date();
  //     }
  //   }

  //   await this.userModuleProgressRepository.save(moduleProgress);
  // }

  // private async updateCourseProgress(courseId: string, userId: string): Promise<void> {
  //   // Obtener todos los módulos del curso
  //   const courseModules = await this.moduleItemRepository
  //     .createQueryBuilder('item')
  //     .innerJoin('item.module', 'module')
  //     .where('module.courseId = :courseId', { courseId })
  //     .select('module.id', 'moduleId')
  //     .groupBy('module.id')
  //     .getRawMany();

  //   // Obtener progreso de todos los módulos
  //   const modulesProgress = await this.userModuleProgressRepository.find({
  //     where: { 
  //       userId, 
  //       moduleId: courseModules.map(m => m.moduleId).includes
  //     }
  //   });

  //   const completedModules = modulesProgress.filter(progress => progress.isCompleted()).length;
  //   const totalModules = courseModules.length;
  //   const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  //   let courseProgress = await this.userCourseProgressRepository.findOne({
  //     where: { userId, courseId }
  //   });

  //   if (!courseProgress) {
  //     courseProgress = this.userCourseProgressRepository.create({
  //       userId,
  //       courseId,
  //       status: progressPercentage === 100 ? CourseStatus.COMPLETED : CourseStatus.IN_PROGRESS,
  //       progressPercentage,
  //       totalModulesCompleted: completedModules,
  //       totalModules
  //     });
  //   } else {
  //     courseProgress.progressPercentage = progressPercentage;
  //     courseProgress.totalModulesCompleted = completedModules;
  //     courseProgress.totalModules = totalModules;
  //     courseProgress.status = progressPercentage === 100 ? CourseStatus.COMPLETED : CourseStatus.IN_PROGRESS;
      
  //     if (progressPercentage === 100) {
  //       courseProgress.completed_at = new Date();
  //     }
  //   }

  //   await this.userCourseProgressRepository.save(courseProgress);
  // }
}
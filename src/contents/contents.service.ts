// src/contents/contents.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItem } from './entities/courses-contents.entity';
import { ModuleItem, ModuleItemType } from '../courses/entities/courses-modules-item.entity';
import { CourseModule } from '../courses/entities/courses-modules.entity';
import { Courses } from '../courses/entities/courses.entity';
import { UserItemProgress } from '../progress/entities/user-item-progress.entity';
import { GetContentOptions } from './contents.controller';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(ContentItem)
    private contentRepository: Repository<ContentItem>,
    @InjectRepository(ModuleItem)
    private moduleItemRepository: Repository<ModuleItem>,
    @InjectRepository(CourseModule)
    private courseModuleRepository: Repository<CourseModule>,
    @InjectRepository(Courses)
    private coursesRepository: Repository<Courses>,
    @InjectRepository(UserItemProgress)
    private userItemProgressRepository: Repository<UserItemProgress>,
  ) {}

  async getById(
    contentId: string, 
    options: GetContentOptions, 
    userId: string, 
    tenantId: string
  ) {
    // 1. Obtener el contenido
    const content = await this.contentRepository.findOne({
      where: { id: contentId, tenantId }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // 2. Buscar el ModuleItem que referencia este contenido
    const moduleItem = await this.moduleItemRepository.findOne({
      where: { 
        referenceId: contentId,
        type: ModuleItemType.CONTENT
      },
      relations: ['module']
    });

    if (!moduleItem) {
      throw new NotFoundException('Content not found in any course module');
    }

    // 3. Obtener información del módulo
    const module = await this.courseModuleRepository.findOne({
      where: { id: moduleItem.moduleId },
      relations: ['configuration']
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // 4. Obtener información del curso
    const course = await this.coursesRepository.findOne({
      where: { id: module.courseId },
      relations: ['translations', 'configuration']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verificar que el usuario tenga acceso al curso del mismo tenant
    if (course.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this course');
    }

    // 5. Obtener navegación
    const navigation = await this.getNavigationItems(moduleItem);

    // 6. Construir la respuesta con la estructura solicitada
    const result = {
      id: content.id,
      title: content.title,
      description: content.description || '',
      content: {
        type: content.contentType,
        contentUrl: content.contentUrl,
        metadata: this.processContentMetadata(content.contentType, content.metadata)
      },
      module: {
        id: module.id,
        title: module.title
      },
      course: {
        id: course.id,
        title: course.getTranslatedTitle('es'), // Usando el método helper del entity
        colorTitle: course.configuration?.colorTitle || '#000000'
      },
      navigation: {
        previousItem: navigation.previousItem,
        nextItem: navigation.nextItem
      },
      userProgress: await this.getUserProgress(moduleItem.id, userId), // Pasamos el itemId en lugar del contentId
      metadata: {
        duration: this.getDurationFromMetadata(content.metadata),
        difficulty: this.getDifficultyFromMetadata(content.metadata),
        tags: this.getTagsFromMetadata(content.metadata),
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString()
      }
    };

    console.log('se busca contenido');

    return result;
  }

  private async getNavigationItems(currentItem: ModuleItem) {
    // Obtener todos los items del mismo módulo ordenados
    const moduleItems = await this.moduleItemRepository.find({
      where: { moduleId: currentItem.moduleId },
      order: { order: 'ASC' }
    });

    const currentIndex = moduleItems.findIndex(item => item.id === currentItem.id);
    
    const navigation = {
      previousItem: null as any,
      nextItem: null as any
    };

    // Item anterior
    if (currentIndex > 0) {
      const prevItem = moduleItems[currentIndex - 1];
      const prevItemDetails = await this.getItemDetails(prevItem);
      
      navigation.previousItem = {
        id: prevItem.id,
        title: prevItemDetails.title,
        type: prevItem.type,
        referenceId: prevItem.referenceId
      };
    }

    // Item siguiente  
    if (currentIndex < moduleItems.length - 1) {
      const nextItem = moduleItems[currentIndex + 1];
      const nextItemDetails = await this.getItemDetails(nextItem);
      
      navigation.nextItem = {
        id: nextItem.id,
        title: nextItemDetails.title,
        type: nextItem.type,
        referenceId: nextItem.referenceId
      };
    }

    return navigation;
  }

  private async getItemDetails(moduleItem: ModuleItem): Promise<{ title: string }> {
    // Dependiendo del tipo de item, obtener el título desde la entidad correspondiente
    switch (moduleItem.type) {
      case ModuleItemType.CONTENT:
        const content = await this.contentRepository.findOne({
          where: { id: moduleItem.referenceId },
          select: ['title']
        });
        return { title: content?.title || 'Untitled Content' };
      
      case ModuleItemType.QUIZ:
        // Aquí irían las consultas para obtener títulos de otros tipos
        // Por ahora retornamos un placeholder
        return { title: 'Quiz Item' };
      
      case ModuleItemType.TASK:
        return { title: 'Task Item' };
      
      case ModuleItemType.FORUM:
        return { title: 'Forum Item' };
      
      case ModuleItemType.SURVEY:
        return { title: 'Survey Item' };
      
      case ModuleItemType.ACTIVITY:
        return { title: 'Activity Item' };
      
      default:
        return { title: 'Unknown Item' };
    }
  }

  private processContentMetadata(contentType: string, metadata: Record<string, any>): any {
    const processedMetadata: any = {};

    switch (contentType) {
      case 'video':
        if (metadata.videoDuration) {
          processedMetadata.videoDuration = metadata.videoDuration;
        }
        break;
      case 'document':
        if (metadata.pageCount) {
          processedMetadata.pageCount = metadata.pageCount;
        }
        break;
      case 'scorm':
        if (metadata.scormVersion) {
          processedMetadata.scormVersion = metadata.scormVersion;
        }
        break;
      // Agregar más casos según sea necesario
    }

    return Object.keys(processedMetadata).length > 0 ? processedMetadata : undefined;
  }

  private getDurationFromMetadata(metadata: Record<string, any>): number {
    // Intentar obtener duración de diferentes campos posibles
    return metadata.duration || 
           metadata.videoDuration || 
           metadata.estimatedTime || 
           0;
  }

  private getDifficultyFromMetadata(metadata: Record<string, any>): 'beginner' | 'intermediate' | 'advanced' {
    const difficulty = metadata.difficulty?.toLowerCase();
    
    if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      return difficulty as 'beginner' | 'intermediate' | 'advanced';
    }
    
    return 'beginner'; // Valor por defecto
  }

  private getTagsFromMetadata(metadata: Record<string, any>): string[] {
    if (Array.isArray(metadata.tags)) {
      return metadata.tags.filter(tag => typeof tag === 'string');
    }
    
    if (typeof metadata.tags === 'string') {
      return metadata.tags.split(',').map(tag => tag.trim());
    }
    
    return [];
  }

  private async getUserProgress(itemId: string, userId: string) {
    try {
      // Buscar el progreso del usuario para este item específico
      const userProgress = await this.userItemProgressRepository.findOne({
        where: { 
          userId: userId,
          itemId: itemId
        }
      });

      // Si no existe progreso, retornar valores por defecto
      if (!userProgress) {
        return {
          isCompleted: false,
          completionDate: undefined,
          timeSpent: 0,
          bookmarked: false,
          lastPosition: undefined
        };
      }

      // Construir la respuesta basada en el progreso encontrado
      const result = {
        isCompleted: userProgress.isCompleted(),
        completionDate: userProgress.completed_at ? userProgress.completed_at.toISOString() : undefined,
        timeSpent: userProgress.timeSpent || 0,
        bookmarked: this.getBookmarkedStatus(userProgress.metadata),
        lastPosition: this.getLastPosition(userProgress.metadata)
      };

      return result;

    } catch (error) {
      // En caso de error, retornar valores por defecto
      console.error('Error fetching user progress:', error);
      return {
        isCompleted: false,
        completionDate: undefined,
        timeSpent: 0,
        bookmarked: false,
        lastPosition: undefined
      };
    }
  }

  /**
   * Extrae el estado de bookmark desde los metadatos
   */
  private getBookmarkedStatus(metadata: Record<string, any>): boolean {
    return metadata?.bookmarked === true || metadata?.isBookmarked === true || false;
  }

  /**
   * Extrae la última posición (útil para videos) desde los metadatos
   */
  private getLastPosition(metadata: Record<string, any>): number | undefined {
    const lastPosition = metadata?.lastPosition || metadata?.videoPosition || metadata?.currentPosition;
    
    if (typeof lastPosition === 'number' && lastPosition > 0) {
      return lastPosition;
    }
    
    return undefined;
  }
}
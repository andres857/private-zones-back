// src/contents/contents.service.ts
import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItem } from './entities/courses-contents.entity';
import { ModuleItem, ModuleItemType } from '../courses/entities/courses-modules-item.entity';
import { CourseModule } from '../courses/entities/courses-modules.entity';
import { Courses } from '../courses/entities/courses.entity';
import { UserItemProgress } from '../progress/entities/user-item-progress.entity';
import { GetContentOptions } from './contents.controller';
import { GetAllContentsOptions, PaginatedContentResponse } from './interfaces/contents.interface';
import { CreateCategoryDto, CreateContentDto } from './dto/contents.dto';
import { ContentType } from 'src/common/enums/contents.enum';
import { ContentCategory } from './entities/courses-contents-categories.entity';

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
    @InjectRepository(ContentCategory)
    private contentCategory: Repository<ContentCategory>
  ) {}

  async findOne(contentId: string, tenantId: string): Promise<ContentItem> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId, tenantId }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async getById(
    contentId: string, 
    options: GetContentOptions, 
    userId: string, 
    tenantId: string
  ) {
    // 1. Obtener el contenido
    const content = await this.contentRepository.findOne({
      where: { id: contentId, tenantId },
      relations: ['courses', 'courses.configuration', 'courses.translations']
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Si NO viene desde módulo, retornar solo la info básica del contenido
    if (!options.fromModule) {
      // Obtener el primer curso si existe (o podrías usar otra lógica)
      const firstCourse = content.courses && content.courses.length > 0 ? content.courses[0] : null;

      return {
          id: content.id,
          title: content.title,
          description: content.description || '',
          content: {
              type: content.contentType,
              contentUrl: content.contentUrl,
              metadata: this.processContentMetadata(content.contentType, content.metadata)
          },
          metadata: {
              duration: this.getDurationFromMetadata(content.metadata),
              difficulty: this.getDifficultyFromMetadata(content.metadata),
              tags: this.getTagsFromMetadata(content.metadata),
              createdAt: content.createdAt.toISOString(),
              updatedAt: content.updatedAt.toISOString()
          },
          // Solo incluir course si existe
          ...(firstCourse && {
              course: {
                  id: firstCourse.id,
                  title: firstCourse.getTranslatedTitle('es'),
                  colorTitle: firstCourse.configuration?.colorTitle || '#000000'
              }
          })
      };
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

  async getAll(options: GetAllContentsOptions): Promise<PaginatedContentResponse> {
    const { courseId, search, contentType, page = 1, limit = 12, tenantId } = options;

    // 📌 1. Construir query base con la relación
    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .innerJoin('content.courses', 'course')
      .where('course.id = :courseId', { courseId })
      .andWhere('content.tenantId = :tenantId', { tenantId });

    // 📌 2. Aplicar filtros opcionales
    if (search) {
      queryBuilder.andWhere('LOWER(content.title) LIKE :search', { 
        search: `%${search.toLowerCase()}%` 
      });
    }

    if (contentType) {
      queryBuilder.andWhere('content.contentType = :contentType', { contentType });
    }

    // 📌 3. Obtener el total
    const total = await queryBuilder.getCount();

    // 📌 4. Aplicar paginación y obtener datos
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('content.createdAt', 'DESC')
      .getMany();

    // 📌 5. Calcular paginación
    const totalPages = Math.ceil(total / limit);

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
    };
  }

  private isValidContentType(type: string): type is ContentType {
    return Object.values(ContentType).includes(type as ContentType);
  }

  async createContent(createContentDto: CreateContentDto): Promise<ContentItem> {
    try {
      // Validar que el contentType sea requerido
      if (!createContentDto.type) {
        throw new BadRequestException('El tipo de contenido es requerido');
      }

      // Validar que el contentType sea un valor válido
      if (!this.isValidContentType(createContentDto.type)) {
        throw new BadRequestException(
          `Tipo de contenido inválido. Debe ser uno de: ${Object.values(ContentType).join(', ')}`
        );
      }

      // Validar otros campos requeridos
      if (!createContentDto.title?.trim()) {
        throw new BadRequestException('El título es requerido');
      }

      if (!createContentDto.contentUrl?.trim()) {
        throw new BadRequestException('La URL del contenido es requerida');
      }

      if (!createContentDto.tenantId) {
        throw new BadRequestException('El tenantId es requerido');
      }

      const course = await this.coursesRepository.findOne({
        where: { 
          id: createContentDto.courseId, 
          tenantId: createContentDto.tenantId 
        }
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Crear el contenido
      const content = new ContentItem();
      content.title = createContentDto.title.trim();
      content.description = createContentDto.description?.trim() ?? '';
      content.contentType = createContentDto.type;
      content.contentUrl = createContentDto.contentUrl.trim();
      content.tenantId = createContentDto.tenantId;
      content.courses = [course];
      content.metadata = createContentDto.metadata ?? {};

      // Guardar en la base de datos
      const savedContent = await this.contentRepository.save(content);
      
      return savedContent;

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

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<ContentCategory> {
    try {
      // Validar campos requeridos
      if (!createCategoryDto.title?.trim()) {
        throw new BadRequestException('El título es requerido');
      }

      if (!createCategoryDto.tenantId) {
        throw new BadRequestException('El tenantId es requerido');
      }

      if (!createCategoryDto.courseId) {
        throw new BadRequestException('El courseId es requerido');
      }

      // Crear la categoría
      const category = new ContentCategory();
      category.title = createCategoryDto.title.trim();
      category.description = createCategoryDto.description?.trim() ?? '';
      category.order = createCategoryDto.order ?? 0;
      category.tenantId = createCategoryDto.tenantId;
      category.courseId = createCategoryDto.courseId;
      category.metadata = createCategoryDto.metadata ?? {};

      const savedCategory = await this.contentCategory.save(category);
      
      return savedCategory;
    } catch (error) {
      // Si es una excepción de BadRequest, la relanzamos
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log del error para debugging
      console.error('Error al crear categoría:', error);

      // Lanzar excepción genérica
      throw new InternalServerErrorException(
        'Error al crear la categoría. Por favor, inténtalo de nuevo.'
      );
    }
  }
}
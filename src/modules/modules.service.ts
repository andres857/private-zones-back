import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { GetAllModulesOptions, PaginatedModuleResponse } from './interfaces/modules.interface';
import { Courses } from 'src/courses/entities/courses.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';
import { CourseModuleConfig } from 'src/courses/entities/courses-modules-config.entity';

@Injectable()
export class ModulesService {

    constructor(
        @InjectRepository(Courses)
        private coursesRepository: Repository<Courses>,

        @InjectRepository(CourseModule)
        private courseModuleRepository: Repository<CourseModule>,
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

            const module = new CourseModule();
            module.title = createModuleDto.title.trim();
            module.description = createModuleDto.description?.trim() || '';
            module.courseId = createModuleDto.courseId;
            module.thumbnailImagePath = createModuleDto.thumbnailImagePath?.trim() || '';

            const config = new CourseModuleConfig();
            config.isActive = true;
            config.courseModuleId = module.id;
            config.order = createModuleDto.order || 999999;
            config.approvalPercentage = createModuleDto.approvalPercentage || 80;
            config.metadata = {};

            module.configuration = config;

            const savedModule = await this.courseModuleRepository.save(module);

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

    findOne(id: number) {
        return `This action returns a #${id} module`;
    }

    update(id: number, updateModuleDto: UpdateModuleDto) {
        return `This action updates a #${id} module`;
    }

    remove(id: number) {
        return `This action removes a #${id} module`;
    }
}

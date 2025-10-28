import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Section } from './entities/sections.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterSectionsDto, SectionListResponseDto, SectionStatsDto } from './dto/filter-sections.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { Courses } from 'src/courses/entities/courses.entity';
import { UpdateSectionDto } from './dto/update-section.dto';
import { TenantsService } from 'src/tenants/tenants.service';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { extractTenantSlugFromRequest } from 'src/utils/tenant.utils';

@Injectable()
export class SectionsService {

    constructor(
        @InjectRepository(Section)
        private sectionsRepository: Repository<Section>,
        @InjectRepository(Courses)
        private coursesRepository: Repository<Courses>,

        private readonly tenantsService: TenantsService,
    ) {}

    // Método para incluir cursos
    async findOneWithCourses(id: string): Promise<Section> {
        const section = await this.sectionsRepository.findOne({
            where: { id },
            relations: ['courses', 'courses.configuration', 'courses.translations'],
        });

        if (!section) {
            throw new NotFoundException(`Section with ID ${id} not found`);
        }

        return section;
    }

    async findAllWithFilters(filters: FilterSectionsDto, request): Promise<SectionListResponseDto> {
        const {
        search,
        isActive, // No existe en Section, lo omitiremos (o puedes agregarlo si es necesario)
        tenantId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt', // No existe, cambiar por un campo válido
        sortOrder = 'DESC'
        } = filters;

        console.log('tenant', request.headers);

        const tenantSlug = extractTenantSlugFromRequest(request);

        if (!tenantSlug) {
            throw new Error('No se pudo extraer el slug del tenant desde los headers.');
        }

        const tenant = await this.tenantsService.findBySlug(tenantSlug);

        if (!tenant) {
            throw new Error(`Tenant no encontrado para slug: ${tenantSlug}`);
        }

        const queryBuilder = this.sectionsRepository
        .createQueryBuilder('section')
        .where('section.tenantId = :tenantId', { tenantId: tenant.id })
        .loadRelationCountAndMap('section.courseCount', 'section.courses')
        // Contar solo cursos activos
        // .loadRelationCountAndMap(
        //     'section.courseCount', 
        //     'section.courses',
        //     'course',
        //     (qb) => qb.where('course.isActive = :isActive', { isActive: true })
        // );
        .leftJoinAndSelect('section.courses', 'courses')
        .leftJoinAndSelect('courses.configuration', 'config')
        // .leftJoinAndSelect('section.tenant', 'tenant')
        // .leftJoinAndSelect('section.courses', 'courses');

        // const [sql, params] = queryBuilder.getQueryAndParameters();
        // console.log('SQL generado:', sql);
        // console.log('Parámetros:', params);

        // Filtro de búsqueda en campos 'name' o 'slug'
        if (search) {
        queryBuilder.andWhere(
            '(section.name ILIKE :search OR section.slug ILIKE :search)',
            { search: `%${search}%` }
        );
        }

        // Filtro por tenantId
        // if (tenantId) {
        // queryBuilder.andWhere('section.tenantId = :tenantId', { tenantId });
        // }

        // Ordenamiento
        const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
        switch (sortBy) {
        case 'name':
            queryBuilder.orderBy('section.name', orderDirection);
            break;
        case 'slug':
            queryBuilder.orderBy('section.slug', orderDirection);
            break;
        case 'order':
            queryBuilder.orderBy('section.order', orderDirection);
            break;
        default:
            queryBuilder.orderBy('section.name', orderDirection); // Fallback válido
        }

        // Paginación
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [sections, total] = await queryBuilder.getManyAndCount();

        return {
        data: sections,
        total,
        page,
        limit,
        };
    }

    async getSectionsStats(): Promise<SectionStatsDto> {
        // Total de usuarios
        const totalSections = await this.sectionsRepository.count();
    
        return {
          totalSections: totalSections, // Cambiado a totalSections
        };
    }

    async findOne(id: string): Promise<Section> {
        const section = await this.sectionsRepository.findOne({ 
            where: { id }, 
            relations: [
                'courses', 
                'courses.configuration', 
                'courses.translations'
            ] 
        });

        if (!section) {
            throw new NotFoundException(`Seccion con ID ${id} no encontrado`);
        }
        
        return section;
    }

    async createSection(createSectionDto: CreateSectionDto): Promise<Section> {
        const section = this.sectionsRepository.create(createSectionDto);
        return this.sectionsRepository.save(section);
    }

    // Método crear con cursos
    async createSectionWithCourses(createSectionDto: CreateSectionDto): Promise<Section> {
        const { courseIds, ...sectionData } = createSectionDto;

        // Verificar que el slug no esté en uso
        const existingSection = await this.sectionsRepository.findOne({
            where: { slug: sectionData.slug }
        });

        if (existingSection) {
            throw new ConflictException(`Section with slug '${sectionData.slug}' already exists`);
        }

        // Crear la sección
        const section = this.sectionsRepository.create(sectionData);

        // Si hay cursos especificados, asociarlos
        if (courseIds && courseIds.length > 0) {
            const courses = await this.coursesRepository.find({
                where: { 
                    id: In(courseIds),
                    tenantId: sectionData.tenantId // Asegurar que pertenecen al mismo tenant
                }
            });

            if (courses.length !== courseIds.length) {
                throw new NotFoundException('Some courses were not found or do not belong to this tenant');
            }

            section.courses = courses;
        }

        return await this.sectionsRepository.save(section);
    }

    // Método para actualizar con cursos
    async updateSectionWithCourses(id: string, updateSectionDto: UpdateSectionDto): Promise<Section> {
        const { courseIds, ...sectionData } = updateSectionDto;

        // Buscar la sección existente
        const section = await this.findOneWithCourses(id);

        // Actualizar propiedades básicas
        Object.assign(section, sectionData);

        // Si se especificaron cursos, actualizar la asociación
        if (courseIds !== undefined) {
            if (courseIds.length > 0) {
                const courses = await this.coursesRepository.find({
                    where: { 
                        id: In(courseIds),
                        tenantId: section.tenantId // Asegurar que pertenecen al mismo tenant
                    }
                });

                if (courses.length !== courseIds.length) {
                    throw new NotFoundException('Some courses were not found or do not belong to this tenant');
                }

                section.courses = courses;
            } else {
                // Si courseIds está vacío, remover todas las asociaciones
                section.courses = [];
            }
        }

        return await this.sectionsRepository.save(section);
    }

    async checkSlugExists(slug: string): Promise<boolean> {
        const section = await this.sectionsRepository.findOne({
            where: { slug }
        });
        return !!section;
    }
}

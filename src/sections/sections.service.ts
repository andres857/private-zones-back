import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Section } from './entities/sections.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterSectionsDto, SectionListResponseDto, SectionStatsDto } from './dto/filter-sections.dto';
import { CreateSectionDto } from './dto/create-section.dto';

@Injectable()
export class SectionsService {

    constructor(
        @InjectRepository(Section)
        private sectionsRepository: Repository<Section>,
    ) {}

    async findAllWithFilters(filters: FilterSectionsDto): Promise<SectionListResponseDto> {
        const {
        search,
        isActive, // No existe en Section, lo omitiremos (o puedes agregarlo si es necesario)
        tenantId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt', // No existe, cambiar por un campo válido
        sortOrder = 'DESC'
        } = filters;

        console.log('Filtros recibidos:', filters);

        const queryBuilder = this.sectionsRepository
        .createQueryBuilder('section')
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
        const user = await this.sectionsRepository.findOne({ where: { id } });

        if (!user) {
          throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return user;
    }

    async createSection(createSectionDto: CreateSectionDto): Promise<Section> {
        const section = this.sectionsRepository.create(createSectionDto);
        return this.sectionsRepository.save(section);
    }
}

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, AssessmentStatus } from './entities/assessment.entity';

interface GetAllByCourseParams {
    courseId: string;
    search?: string;
    actives?: boolean;
    page: number;
    limit: number;
    tenantId: string;
}

@Injectable()
export class AssessmentsService {
    constructor(
        @InjectRepository(Assessment)
        private readonly assessmentRepository: Repository<Assessment>,
    ) {}

    async getAllByCourse(params: GetAllByCourseParams) {
        const { courseId, search, actives, page, limit, tenantId } = params;

        // 📌 Query base
        const queryBuilder = this.assessmentRepository
            .createQueryBuilder('assessment')
            .leftJoinAndSelect('assessment.translations', 'translations')
            .leftJoinAndSelect('assessment.configuration', 'configuration')
            .where('assessment.tenantId = :tenantId', { tenantId })
            .andWhere('assessment.courseId = :courseId', { courseId });

        // 📌 Filtro de activos
        if (actives !== undefined) {
            queryBuilder.andWhere('assessment.isActive = :isActive', { isActive: actives });
        }

        // 📌 Búsqueda por título/descripción en traducciones
        if (search && search.trim() !== '') {
            queryBuilder.andWhere(
                '(translations.title ILIKE :search OR translations.description ILIKE :search OR assessment.slug ILIKE :search)',
                { search: `%${search.trim()}%` }
            );
        }

        // 📌 Ordenar por order y fecha de creación
        queryBuilder
            .orderBy('assessment.order', 'ASC')
            .addOrderBy('assessment.created_at', 'DESC');

        // 📌 Contar total antes de paginar
        const total = await queryBuilder.getCount();

        // 📌 Aplicar paginación
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // 📌 Obtener resultados
        const assessments = await queryBuilder.getMany();

        // 📌 Calcular stats
        const statsQuery = this.assessmentRepository
            .createQueryBuilder('assessment')
            .where('assessment.tenantId = :tenantId', { tenantId })
            .andWhere('assessment.courseId = :courseId', { courseId });

        const [
            totalActive,
            totalDraft,
            totalPublished,
            totalArchived
        ] = await Promise.all([
            statsQuery.clone().andWhere('assessment.isActive = true').getCount(),
            statsQuery.clone().andWhere('assessment.status = :status', { status: AssessmentStatus.DRAFT }).getCount(),
            statsQuery.clone().andWhere('assessment.status = :status', { status: AssessmentStatus.PUBLISHED }).getCount(),
            statsQuery.clone().andWhere('assessment.status = :status', { status: AssessmentStatus.ARCHIVED }).getCount(),
        ]);

        // 📌 Construir respuesta
        return {
            data: assessments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
            stats: {
                total,
                totalActive,
                totalInactive: total - totalActive,
                totalDraft,
                totalPublished,
                totalArchived,
            },
        };
    }


    async getById(id: string, tenantId: string): Promise<Assessment> {
        try {
            const assessment = await this.assessmentRepository.findOne({
                where: {
                    id,
                    tenantId,
                },
                relations: ['translations', 'configuration'],
            });

            if (!assessment) {
                throw new NotFoundException('Assessment not found');
            }

            return assessment;
            
        } catch (error) {
            throw new InternalServerErrorException('Error fetching assessment');
        }
    }
}
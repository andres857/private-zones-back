import { BadRequestException, DefaultValuePipe, Get, Injectable, InternalServerErrorException, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { CreateForumDto } from './dto/forum.dto';
import { Forum } from './entities/forum.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForumStats, GetAllForumsOptions, PaginatedForumResponse } from './interfaces/forums.interface';
import { Courses } from 'src/courses/entities/courses.entity';

@Injectable()
export class ForumsService {

    constructor
        (
            @InjectRepository(Forum)
            private forumRepository: Repository<Forum>,

            @InjectRepository(Courses)
            private coursesRepository: Repository<Courses>,
        ) { }


    async createForum(createForumDto: CreateForumDto, user): Promise<Forum> {
        try {

            if (!createForumDto.title || createForumDto.title.trim().length < 2 || createForumDto.title.trim().length > 100) {
                throw new BadRequestException('El titulo debe tener entre 2 y 100 caracteres');
            }

            if (!createForumDto.tenantId) {
                throw new BadRequestException('El tenantId es requerido');
            }

            // Creacion de Forum
            const newForum = new Forum();
            newForum.title = createForumDto.title.trim();
            newForum.description = createForumDto.description?.trim() || null;
            newForum.thumbnail = createForumDto.thumbnail || null;
            newForum.expirationDate = createForumDto.expirationDate || null;
            newForum.isActive = createForumDto.isActive !== undefined ? createForumDto.isActive : true;
            newForum.isPinned = createForumDto.isPinned || false;
            newForum.category = createForumDto.category?.trim() || null;
            newForum.tags = createForumDto.tags || [];
            newForum.viewCount = createForumDto.viewCount || 0;
            newForum.authorId = user.id;
            newForum.tenantId = createForumDto.tenantId;

            const savedForum = await this.forumRepository.save(newForum);

            return savedForum;
        } catch (error) {
            // Re-lanzar errores de validación
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Log del error para debugging
            console.error('Error creando Forum:', error);
            throw new InternalServerErrorException('Error interno creando el foro');
        }
    }

    async updateForum(forumId: string, updateForumDto: CreateForumDto): Promise<Forum> {
        try {
            const forum = await this.forumRepository.findOne({ where: { id: forumId } });

            if (!forum) {
                throw new BadRequestException('Foro no encontrado');
            }

            if (updateForumDto.title) {
                if (updateForumDto.title.trim().length < 2 || updateForumDto.title.trim().length > 100) {
                    throw new BadRequestException('El titulo debe tener entre 2 y 100 caracteres');
                }
                forum.title = updateForumDto.title.trim();
            }

            if (updateForumDto.description !== undefined) {
                forum.description = updateForumDto.description?.trim() || null;
            }

            if (updateForumDto.thumbnail !== undefined) {
                forum.thumbnail = updateForumDto.thumbnail || null;
            }

            if (updateForumDto.expirationDate !== undefined) {
                forum.expirationDate = updateForumDto.expirationDate || null;
            }

            if (updateForumDto.isActive !== undefined) {
                forum.isActive = updateForumDto.isActive;
            }

            if (updateForumDto.isPinned !== undefined) {
                forum.isPinned = updateForumDto.isPinned;
            }

            if (updateForumDto.category !== undefined) {
                forum.category = updateForumDto.category?.trim() || null;
            }

            if (updateForumDto.tags !== undefined) {
                forum.tags = updateForumDto.tags || [];
            }

            const updatedForum = await this.forumRepository.save(forum);

            return updatedForum;
        } catch (error) {
            // Re-lanzar errores de validación
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Log del error para debugging
            console.error('Error actualizando Forum:', error);
            throw new InternalServerErrorException('Error interno actualizando el foro');
        }
    }

    async getById(forumId: string, tenantId: string): Promise<Forum> {
        try {
            const forum = await this.forumRepository.findOne({
                where: { 
                    id: forumId,
                    tenantId 
                },
                relations: ['author', 'comments', 'reactions']
            });

            if (!forum) {
                throw new BadRequestException('Foro no encontrado');
            }

            return forum;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            console.error('Error obteniendo foro por ID:', error);
            throw new InternalServerErrorException('Error interno obteniendo el foro');
        }
    }

    async getAll(options: GetAllForumsOptions): Promise<PaginatedForumResponse> {
    try {
        const { courseId, search, page = 1, limit = 12, tenantId } = options;

        if (!courseId) {
            throw new BadRequestException('El courseId es requerido');
        }

        const course = await this.coursesRepository.findOne({
            where: { id: courseId, tenantId },
            relations: ['modules', 'modules.items'],
        }) as Courses;

        if (!course) {
            throw new BadRequestException('Curso no encontrado');
        }

        const forumIds = course.getAllItems()
            .filter(item => item.type === 'forum')
            .map(item => item.referenceId);

        console.log('📌 Forum IDs encontrados:', forumIds);

        if (!forumIds.length) {
            return {
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
                stats: {
                    totalForums: 0,
                    totalThreads: 0,
                    totalPosts: 0,
                    activeUsers: 0,
                },
            };
        }

        // 🔍 QUERY SIN JOINS PARA CONTAR CORRECTAMENTE
        let countQuery = this.forumRepository
            .createQueryBuilder('forum')
            .where('forum.id IN (:...ids)', { ids: forumIds })
            .andWhere('forum.tenantId = :tenantId', { tenantId });

        if (search) {
            countQuery.andWhere('LOWER(forum.title) LIKE :search', {
                search: `%${search.toLowerCase()}%`
            });
        }

        const total = await countQuery.getCount();
        console.log('📊 Total count:', total);

        // 🔍 QUERY CON JOINS PARA TRAER LOS DATOS
        let dataQuery = this.forumRepository
            .createQueryBuilder('forum')
            .leftJoinAndSelect('forum.comments', 'comments')
            .leftJoinAndSelect('forum.author', 'author')
            .leftJoinAndSelect('comments.author', 'commentAuthor')
            .where('forum.id IN (:...ids)', { ids: forumIds })
            .andWhere('forum.tenantId = :tenantId', { tenantId });

        if (search) {
            dataQuery.andWhere('LOWER(forum.title) LIKE :search', {
                search: `%${search.toLowerCase()}%`
            });
        }

        const data = await dataQuery
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('forum.createdAt', 'DESC')
            .getMany();

        console.log('📦 Data obtenida:', data.length, 'foros');
        console.log('📦 Primer foro:', data[0]?.id, data[0]?.title);

        // 🔍 DEBUG: Intentar traer SIN filtros para verificar
        const allForumsDebug = await this.forumRepository.find({
            where: { tenantId },
            take: 5
        });
        console.log('🔎 DEBUG - Todos los foros del tenant:', allForumsDebug.length);
        console.log('🔎 DEBUG - IDs en DB:', allForumsDebug.map(f => f.id));

        const totalPages = Math.ceil(total / limit);

        // Calcular estadísticas
        const stats = await this.calculateStats(forumIds, tenantId);

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
            stats,
        };
    } catch (error) {
        if (error instanceof BadRequestException) {
            throw error;
        }

        console.error('Error obteniendo foros:', error);
        throw new InternalServerErrorException('Error interno obteniendo los foros');
    }
}

    private async calculateStats(forumIds: string[], tenantId: string): Promise<ForumStats> {
        try {
            // Total de foros
            const totalForums = forumIds.length;

            // Total de threads (comentarios raíz - sin parentCommentId)
            const totalThreads = await this.forumRepository
                .createQueryBuilder('forum')
                .leftJoin('forum.comments', 'comments')
                .where('forum.id IN (:...ids)', { ids: forumIds })
                .andWhere('forum.tenantId = :tenantId', { tenantId })
                .andWhere('comments.parentCommentId IS NULL')
                .getCount();

            // Total de posts (todos los comentarios)
            const totalPostsResult = await this.forumRepository
                .createQueryBuilder('forum')
                .leftJoin('forum.comments', 'comments')
                .where('forum.id IN (:...ids)', { ids: forumIds })
                .andWhere('forum.tenantId = :tenantId', { tenantId })
                .select('COUNT(comments.id)', 'count')
                .getRawOne();

            const totalPosts = parseInt(totalPostsResult?.count || '0');

            // Usuarios activos (autores únicos de foros + comentaristas únicos)
            const activeUsersResult = await this.forumRepository
                .createQueryBuilder('forum')
                .leftJoin('forum.comments', 'comments')
                .where('forum.id IN (:...ids)', { ids: forumIds })
                .andWhere('forum.tenantId = :tenantId', { tenantId })
                .select('COUNT(DISTINCT forum.authorId)', 'forumAuthors')
                .addSelect('COUNT(DISTINCT comments.authorId)', 'commentAuthors')
                .getRawOne();

            const forumAuthors = parseInt(activeUsersResult?.forumAuthors || '0');
            const commentAuthors = parseInt(activeUsersResult?.commentAuthors || '0');
            const activeUsers = forumAuthors + commentAuthors;

            return {
                totalForums,
                totalThreads,
                totalPosts,
                activeUsers,
            };
        } catch (error) {
            console.error('Error calculando estadísticas:', error);
            // Retornar estadísticas por defecto en caso de error
            return {
                totalForums: forumIds.length,
                totalThreads: 0,
                totalPosts: 0,
                activeUsers: 0,
            };
        }
    }

}

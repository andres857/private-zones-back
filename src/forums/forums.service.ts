import { BadRequestException, DefaultValuePipe, Get, Injectable, InternalServerErrorException, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { CreateForumDto } from './dto/forum.dto';
import { Forum } from './entities/forum.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetAllForumsOptions, PaginatedForumResponse } from './interfaces/forums.interface';
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


    async createForum(createForumDto: CreateForumDto): Promise<Forum> {
        try {

            if(!createForumDto.title || createForumDto.title.trim().length < 2 || createForumDto.title.trim().length > 100){
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
            newForum.authorId = createForumDto.authorId;
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
                throw new Error('Course not found');
            }

            const forumIds = course.getAllItems()
            .filter(item => item.type === 'forum')
            .map(item => item.referenceId);

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
                };
            }

            const baseQuery = this.forumRepository
            .createQueryBuilder('forum')
            .where('forum.id IN (:...ids)', { ids: forumIds })
            .andWhere('forum.tenantId = :tenantId', { tenantId });

            if (search) {
                baseQuery.andWhere('LOWER(forum.title) LIKE :search', { search: `%${search.toLowerCase()}%` });
            }

            const total = await baseQuery.getCount();

            const data = await baseQuery
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('forum.createdAt', 'DESC')
            .getMany();

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
        } catch (error) {
            // Re-lanzar errores de validación
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Log del error para debugging
            console.error('Error obteniendo foros:', error);
            throw new InternalServerErrorException('Error interno obteniendo los foros');
        }
    }

}

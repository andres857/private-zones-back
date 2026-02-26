import { BadRequestException, DefaultValuePipe, Get, Injectable, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { CreateForumDto } from './dto/forum.dto';
import { Forum } from './entities/forum.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForumStats, GetAllForumsOptions, PaginatedForumResponse } from './interfaces/forums.interface';
import { Courses } from 'src/courses/entities/courses.entity';
import { ForumComment } from './entities/forum-comment.entity';
import { ForumReaction } from './entities/forum-reaction.entity';
import { CommentReaction } from './entities/comment-reaction.entity';
import { UserProgressService } from 'src/progress/services/user-progress.service';
import { ModuleItem, ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';

@Injectable()
export class ForumsService {

    constructor
        (
            @InjectRepository(Forum)
            private forumRepository: Repository<Forum>,

            @InjectRepository(Courses)
            private coursesRepository: Repository<Courses>,

            @InjectRepository(ForumComment)
            private commentRepository: Repository<ForumComment>,

            @InjectRepository(ForumReaction)
            private forumReactionRepository: Repository<ForumReaction>,

            @InjectRepository(CommentReaction)
            private commentReactionRepository: Repository<CommentReaction>,

            @InjectRepository(ModuleItem)
            private moduleItemRepository: Repository<ModuleItem>,

            private readonly userProgressService: UserProgressService,
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
            newForum.courseId = createForumDto.courseId;

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
                relations: [
                    'author',
                    'comments',
                    'comments.author',
                    'comments.reactions',
                    'comments.replies',
                    'comments.replies.author',
                    'comments.replies.reactions',
                    'reactions',
                    'course'
                ]
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

            // Verificar que el curso existe y pertenece al tenant
            const course = await this.coursesRepository.findOne({
                where: { id: courseId, tenantId }
            });

            if (!course) {
                throw new NotFoundException('Curso no encontrado');
            }

            // 🔍 QUERY BASE - Buscar directamente por courseId
            const baseWhere = {
                courseId,
                tenantId,
                isActive: true // Opcional: solo foros activos
            };

            // 🔍 COUNT QUERY
            let countQuery = this.forumRepository
                .createQueryBuilder('forum')
                .where('forum.courseId = :courseId', { courseId })
                .andWhere('forum.tenantId = :tenantId', { tenantId })
                .andWhere('forum.isActive = :isActive', { isActive: true });

            if (search) {
                countQuery.andWhere(
                    '(LOWER(forum.title) LIKE :search OR LOWER(forum.description) LIKE :search)',
                    { search: `%${search.toLowerCase()}%` }
                );
            }

            const total = await countQuery.getCount();
            console.log('📊 Total forums found:', total);

            // 🔍 DATA QUERY CON JOINS
            let dataQuery = this.forumRepository
                .createQueryBuilder('forum')
                .leftJoinAndSelect('forum.author', 'author')
                .leftJoinAndSelect('forum.comments', 'comments')
                .leftJoinAndSelect('comments.author', 'commentAuthor')
                .where('forum.courseId = :courseId', { courseId })
                .andWhere('forum.tenantId = :tenantId', { tenantId })
                .andWhere('forum.isActive = :isActive', { isActive: true });

            if (search) {
                dataQuery.andWhere(
                    '(LOWER(forum.title) LIKE :search OR LOWER(forum.description) LIKE :search)',
                    { search: `%${search.toLowerCase()}%` }
                );
            }

            const data = await dataQuery
                .skip((page - 1) * limit)
                .take(limit)
                .orderBy('forum.isPinned', 'DESC') // Foros fijados primero
                .addOrderBy('forum.createdAt', 'DESC') // Luego más recientes
                .getMany();

            console.log('📦 Forums retrieved:', data.length);

            const totalPages = Math.ceil(total / limit);

            // Calcular estadísticas basadas en courseId
            const stats = await this.calculateStatsByCourse(courseId, tenantId);

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
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            console.error('Error obteniendo foros:', error);
            throw new InternalServerErrorException('Error interno obteniendo los foros');
        }
    }

    // Método auxiliar actualizado para calcular stats
    private async calculateStatsByCourse(courseId: string, tenantId: string) {
        const forums = await this.forumRepository.find({
            where: { courseId, tenantId, isActive: true },
            relations: ['comments', 'comments.author']
        });

        const totalForums = forums.length;
        const totalThreads = forums.reduce((acc, forum) => acc + forum.getCommentCount(), 0);
        
        // Contar usuarios únicos que han comentado
        const uniqueAuthors = new Set<string>();
        forums.forEach(forum => {
            uniqueAuthors.add(forum.authorId);
            forum.comments?.forEach(comment => {
                uniqueAuthors.add(comment.authorId);
            });
        });

        return {
            totalForums,
            totalThreads,
            totalPosts: totalThreads, // O puedes contar posts de otra manera
            activeUsers: uniqueAuthors.size
        };
    }

    async incrementViewCount(forumId: string): Promise<void> {
        await this.forumRepository.increment({ id: forumId }, 'viewCount', 1);
    }

    async addReaction(forumId: string, userId: string, type: string): Promise<ForumReaction> {
        // Upsert — si ya existe, actualiza el tipo
        const existing = await this.forumReactionRepository.findOne({
            where: { forumId, userId }
        });

        if (existing) {
            existing.type = type as any;
            return this.forumReactionRepository.save(existing);
        }

        const reaction = this.forumReactionRepository.create({ forumId, userId, type: type as any });
        return this.forumReactionRepository.save(reaction);
    }

    async removeReaction(forumId: string, userId: string): Promise<void> {
        await this.forumReactionRepository.delete({ forumId, userId });
    }

    async addComment(
        forumId: string,
        userId: string,
        data: { content: string; parentCommentId?: string }
    ): Promise<ForumComment> {
        const comment = this.commentRepository.create({
            forumId,
            authorId: userId,
            content: data.content,
            parentCommentId: data.parentCommentId,
        });

        const savedComment = await this.commentRepository.save(comment);

        // Registrar progreso solo si es comentario raíz (no respuesta)
        if (!data.parentCommentId) {
            await this.registerForumParticipationProgress(forumId, userId);
        }

        return savedComment;
    }

    private async registerForumParticipationProgress(
        forumId: string,
        userId: string
    ): Promise<void> {
        try {
        // Buscar el ModuleItem que apunta a este foro
        const moduleItem = await this.moduleItemRepository.findOne({
            where: {
                referenceId: forumId,
                type: ModuleItemType.FORUM,
            },
        });

        if (!moduleItem) {
            console.warn(`No se encontró ModuleItem para el foro ${forumId}`);
            return;
        }

        const percentage = 100; // Asumimos que participar en el foro completa el item al 100%

        // Marcar el item como completado
        await this.userProgressService.completeItem(userId, moduleItem.id, {}, percentage, {
            percentage,
            metadata: {
                completedVia: 'forum_participation',
                forumId,
            },
        });

        } catch (error) {
            // No propagar el error para no afectar la creación del comentario
            console.error('Error registrando progreso de participación en foro:', error);
        }
    }


    async updateComment(commentId: string, userId: string, content: string): Promise<ForumComment> {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, authorId: userId }
        });

        if (!comment) {
            throw new NotFoundException('Comentario no encontrado o sin permisos');
        }

        comment.content = content;
        comment.isEdited = true;
        return this.commentRepository.save(comment);
    }

    async deleteComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, authorId: userId }
        });

        if (!comment) {
            throw new NotFoundException('Comentario no encontrado o sin permisos');
        }

        await this.commentRepository.softDelete(commentId);
    }

    async addCommentReaction(commentId: string, userId: string, type: string): Promise<CommentReaction> {
        const existing = await this.commentReactionRepository.findOne({
            where: { commentId, userId }
        });

        if (existing) {
            existing.type = type as any;
            return this.commentReactionRepository.save(existing);
        }

        const reaction = this.commentReactionRepository.create({ 
            commentId, userId, type: type as any 
        });
        return this.commentReactionRepository.save(reaction);
    }

    async removeCommentReaction(commentId: string, userId: string): Promise<void> {
        await this.commentReactionRepository.delete({ commentId, userId });
    }

}

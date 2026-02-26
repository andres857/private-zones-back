import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, InternalServerErrorException, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { ForumsService } from './forums.service';
import { ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';
import { UserProgressService } from 'src/progress/services/user-progress.service';

@Controller('forums')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ForumsController {

    constructor(
        private readonly forumsService: ForumsService,
        private readonly progressService: UserProgressService
    ) { }

    @Post('/create')
    async createForum(@Req() request: AuthenticatedRequest, @Body() body: any){
        try {

            const savedForum = await this.forumsService.createForum(body, request.user);

            return {
                success: true,
                message: 'Foro creado exitosamente',
                data: {
                    id: savedForum.id,
                    title: savedForum.title,
                    tenantId: savedForum.tenantId,
                    createdAt: savedForum.createdAt
                }
            }
        } catch (error) {
            throw error;
        }
    }

    @Post('/update/:forumId')
    async updateForum(@Req() request: AuthenticatedRequest, @Param('forumId') forumId: string, @Body() body: any){
        try {

            const updatedForum = await this.forumsService.updateForum(forumId, body);

            return {
                success: true,
                message: 'Foro actualizado exitosamente',
                data: {
                    id: updatedForum.id,
                    title: updatedForum.title,
                    tenantId: updatedForum.tenantId,
                    updatedAt: updatedForum.updatedAt
                }
            }
        } catch (error) {
            throw error;
        }
    }

    @Get('/:forumId')
    async getForumById(@Req() request: AuthenticatedRequest, @Param('forumId') forumId: string, @Query('fromModule') fromModule?: boolean,) {
        try {
            const tenantId = request.tenant?.id;
            const userId = request.user?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const forum = await this.forumsService.getById(forumId, tenantId);


            console.log('Foro obtenido:', forum);
            console.log('fromModule:', fromModule, 'userId:', userId);

            // Registrar inicio de progreso si viene desde un módulo
            if (fromModule && userId) {
                try {
                    await this.progressService.startItemProgress(
                        forumId,
                        userId,
                        ModuleItemType.FORUM,
                    );
                } catch (error) {
                    // No bloquear la carga del foro si falla el progreso
                    console.warn('No se pudo registrar progreso de inicio de foro');
                }
            }

            return {
                success: true,
                message: 'Foro obtenido exitosamente',
                data: forum
            };
        } catch (error) {
            throw error;
        }
    }

    @Get('/course/:courseId')
    async getAllForums(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
        ) {
        try {
            const userId = request.user?.['id'];
            const tenantId = request.tenant?.id;

            if (!userId) {
                throw new BadRequestException('Usuario no autenticado');
            }

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 20);

            const result = await this.forumsService.getAll({
                courseId,
                search,
                page: validPage,
                limit: validLimit,
                tenantId,
            });

            return {
                success: true,
                message: 'Foros obtenidos exitosamente',
                data: result.data,
                pagination: result.pagination,
                stats: result.stats,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
            throw error;
            }
            console.error('Error obteniendo foros:', error);
            throw new InternalServerErrorException('Error interno obteniendo los foros');
        }
    }


    @Post('/:forumId/view')
    async incrementView(
        @Req() request: AuthenticatedRequest,
        @Param('forumId') forumId: string
    ) {
        await this.forumsService.incrementViewCount(forumId);
        return { success: true, message: 'Vista registrada' };
    }

    // ==================== REACCIONES DEL FORO ====================

    @Post('/:forumId/reactions')
    async addReaction(
        @Req() request: AuthenticatedRequest,
        @Param('forumId') forumId: string,
        @Body() body: { type: string }
    ) {
        const userId = request.user?.id;

        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        const reaction = await this.forumsService.addReaction(forumId, userId, body.type);

        return { success: true, message: 'Reacción agregada', data: reaction };
    }

    @Delete('/:forumId/reactions')
    async removeReaction(
        @Req() request: AuthenticatedRequest,
        @Param('forumId') forumId: string
    ) {
        const userId = request.user?.id;
        
        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        await this.forumsService.removeReaction(forumId, userId);
        return { success: true, message: 'Reacción eliminada' };
    }

    // ==================== COMENTARIOS ====================

    @Post('/:forumId/comments')
    async addComment(
        @Req() request: AuthenticatedRequest,
        @Param('forumId') forumId: string,
        @Body() body: { content: string; parentCommentId?: string }
    ) {
        const userId = request.user?.id;
        
        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        const comment = await this.forumsService.addComment(forumId, userId, body);
        return { success: true, message: 'Comentario agregado', data: comment };
    }

    @Patch('/comments/:commentId')
    async updateComment(
        @Req() request: AuthenticatedRequest,
        @Param('commentId') commentId: string,
        @Body() body: { content: string }
    ) {
        const userId = request.user?.id;
        
        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        const comment = await this.forumsService.updateComment(commentId, userId, body.content);
        return { success: true, message: 'Comentario actualizado', data: comment };
    }

    @Delete('/comments/:commentId')
    async deleteComment(
        @Req() request: AuthenticatedRequest,
        @Param('commentId') commentId: string
    ) {
        const userId = request.user?.id;
        
        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        await this.forumsService.deleteComment(commentId, userId);
        return { success: true, message: 'Comentario eliminado' };
    }

    // ==================== REACCIONES DE COMENTARIOS ====================

    @Post('/comments/:commentId/reactions')
    async addCommentReaction(
        @Req() request: AuthenticatedRequest,
        @Param('commentId') commentId: string,
        @Body() body: { type: string }
    ) {
        const userId = request.user?.id;
        
        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        const reaction = await this.forumsService.addCommentReaction(commentId, userId, body.type);
        return { success: true, message: 'Reacción agregada', data: reaction };
    }

    @Delete('/comments/:commentId/reactions')
    async removeCommentReaction(
        @Req() request: AuthenticatedRequest,
        @Param('commentId') commentId: string
    ) {
        const userId = request.user?.id;
        
        if (!userId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        await this.forumsService.removeCommentReaction(commentId, userId);
        return { success: true, message: 'Reacción eliminada' };
    }

}

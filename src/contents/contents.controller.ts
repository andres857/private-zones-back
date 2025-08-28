// src/contents/contents.controller.ts
import { Controller, Get, Param, Query, UseGuards, Req, UseInterceptors, Post, Body, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { UserProgressService } from '../progress/services/user-progress.service';

export interface GetContentOptions {
    includeCourse?: boolean;
    includeModule?: boolean;
    includeNavigation?: boolean;
}

@Controller('contents')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ContentsController {
    constructor(
        private readonly contentsService: ContentsService,
        private readonly progressService: UserProgressService
    ) { }

    @Get('course/:courseId')
    async getAllByCourse(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('contentType') contentType?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ) {
        const userId = request.user?.['id'];
        const tenantId = request.tenant?.id;

        if (!userId) throw new Error('User not authenticated');
        if (!tenantId) throw new Error('Tenant not validated');

        // 📌 Validar que page y limit sean valores válidos
        const validPage = Math.max(1, page || 1);
        const validLimit = Math.min(Math.max(1, limit || 12), 100); // máximo 100 por página

        return this.contentsService.getAll({
        courseId,
        search,
        contentType,
        page: validPage,
        limit: validLimit,
        userId,
        tenantId,
        });
    }



    @Get(':contentId')
    async getById(
        @Req() request: AuthenticatedRequest,
        @Param('contentId') contentId: string,
        @Query('includeCourse') includeCourse?: string,
        @Query('includeModule') includeModule?: string,
        @Query('includeNavigation') includeNavigation?: string,
    ) {
        const userId = request.user?.['id'];
        const tenantId = request.tenant?.id;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!tenantId) {
            throw new Error('Tenant not validated');
        }

        const options: GetContentOptions = {
            includeCourse: includeCourse === 'true',
            includeModule: includeModule === 'true',
            includeNavigation: includeNavigation === 'true'
        };

        await this.progressService.startItemProgress(contentId, userId);

        return await this.contentsService.getById(contentId, options, userId, tenantId);
    }

    @Post(':contentId/progress')
    async updateProgress(
        @Req() request: AuthenticatedRequest,
        @Param('contentId') contentId: string,
        @Body() progressData: { progressPercentage?: number; timeSpent?: number; }
    ) {
        const userId = request.user?.['id'];

        console.log('inicia proceso de actualizacion de progreso');

        if (!userId) {
            throw new Error('User not authenticated');
        }

        console.log('itemId:',contentId, 'userId',userId, 'progreso:', progressData.progressPercentage ?? 0, progressData.timeSpent);

        return await this.progressService.updateItemProgress(contentId, userId, progressData.progressPercentage ?? 0, progressData.timeSpent);
    }

    @Post(':contentId/complete')
    async markComplete(
        @Req() request: AuthenticatedRequest,
        @Param('contentId') contentId: string
    ) {
        const userId = request.user?.['id'];

        console.log('inicia proceso de completado de progreso');


        if (!userId) {
            throw new Error('User not authenticated');
        }

        return await this.progressService.completeItem(contentId, userId);
    }

    @Post('/create')
    async createContents(@Req() request: AuthenticatedRequest, @Body() body: any){
        try {
            const savedContent = await this.contentsService.createContent(body);
            
            // Retornar respuesta exitosa con el contenido creado
            return {
                success: true,
                message: 'Contenido creado exitosamente',
                data: {
                    id: savedContent.id,
                    title: savedContent.title,
                    contentType: savedContent.contentType,
                    contentUrl: savedContent.contentUrl,
                    description: savedContent.description,
                    createdAt: savedContent.createdAt
                }
            };
        } catch (error) {
            // Los errores ya son manejados en el service, simplemente los re-lanzamos
            throw error;
        }
    }
}
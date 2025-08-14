// src/contents/contents.controller.ts
import { Controller, Get, Param, Query, UseGuards, Req, UseInterceptors, Post, Body } from '@nestjs/common';
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
}
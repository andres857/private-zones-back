// src/assessments/assessment-sessions.controller.ts

import { Controller, Post, Get, Query, Body, Req, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AssessmentSessionsService } from './assessment-sessions.service';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';

@Controller('assessment-sessions')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class AssessmentSessionsController {
    constructor(
        private readonly sessionsService: AssessmentSessionsService,
    ) { }

    @Post('create')
    async createSession(
        @Req() request: AuthenticatedRequest,
        @Body('assessmentId') assessmentId: string,
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

            const result = await this.sessionsService.createSession(
                assessmentId,
                userId,
                tenantId,
            );

            console.log('Sesión creada:', result);

            return {
                success: true,
                message: 'Sesión creada exitosamente',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    @Get('validate')
    async validateToken(
        @Query('token') token: string,
        @Query('assessmentId') assessmentId: string,
    ) {
        try {
            const session = await this.sessionsService.validateToken(
                token,
                assessmentId,
            );

            console.log('Token validado:', session);

            return {
                success: true,
                data: {
                    id: session.id,
                    attemptId: session.attemptId,
                    expiresAt: session.expiresAt,
                },
            };
        } catch (error) {
            throw error;
        }
    }
}
import { Controller, Post, Param, Body, UseGuards, UseInterceptors, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AssessmentAttemptsService } from './assessment-attempts.service';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';

@Controller('assessment-attempts')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class AssessmentAttemptsController {
    constructor(
        private readonly attemptsService: AssessmentAttemptsService,
    ) { }

    @Post(':attemptId/submit')
    async submitAttempt(
        @Req() request: AuthenticatedRequest,
        @Param('attemptId') attemptId: string,
        @Body('answers') answers: Record<string, any>,
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

            const result = await this.attemptsService.submitAttempt(
                attemptId,
                userId,
                tenantId,
                answers,
            );

            return {
                success: true,
                message: 'Evaluación enviada exitosamente',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }
}
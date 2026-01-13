import { BadRequestException, Controller, DefaultValuePipe, Get, InternalServerErrorException, Param, ParseIntPipe, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthGuard } from '@nestjs/passport';

@Controller('assessments')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class AssessmentsController {
    constructor(private readonly assessmentService: AssessmentsService) { }

    @Get('course/:courseId')
    async getAllByCourse(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('actives') actives?: boolean,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ){

        try {

            const userId = request.user?.['id'];
    
            const tenantId = request.tenant?.id;

            if (!userId) {
                throw new BadRequestException('Usuario no autenticado');
            }

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            // 📌 Validar que page y limit sean valores válidos
            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 50); // máximo 50 por página

            const result = await this.assessmentService.getAllByCourse({
                courseId,
                search,
                actives,
                page: validPage,
                limit: validLimit,
                tenantId,
            });

            return {
                success: true,
                message: 'Evaluaciones obtenidas exitosamente',
                data: result.data,
                pagination: result.pagination,
                stats: result.stats,
            };
            
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error obteniendo evaluaciones:', error);
            throw new InternalServerErrorException('Error interno obteniendo las evaluaciones');
        }
    }

    @Get(':id')
    async getById(
        @Req() request: AuthenticatedRequest,
        @Param('id') id: string,
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

            const assessment = await this.assessmentService.getById(id, tenantId);

            return {
                success: true,
                message: 'Evaluación obtenida exitosamente',
                data: assessment,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error obteniendo evaluación:', error);
            throw new InternalServerErrorException('Error interno obteniendo la evaluación');
        }
    }

}

import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { QuestionsService } from './questions.service';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('assessments')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class AssessmentsController {
    constructor(
        private readonly assessmentService: AssessmentsService,
        private readonly questionsService: QuestionsService,
    ) { }

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

    @Post()
    async createAssessment(
        @Req() request: AuthenticatedRequest,
        @Body() createAssessmentDto: CreateAssessmentDto,
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

            const assessment = await this.assessmentService.create({
                ...createAssessmentDto,
                tenantId,
            });

            return {
                success: true,
                message: 'Evaluación creada exitosamente',
                data: assessment,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error creando evaluación:', error);
            throw new InternalServerErrorException('Error interno creando la evaluación');
        }
    }

    @Put(':id')
    async update(
        @Req() request: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() updateAssessmentDto: UpdateAssessmentDto,
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

            const assessment = await this.assessmentService.update(id, {
                ...updateAssessmentDto,
                tenantId,
            });

            return {
                success: true,
                message: 'Evaluación actualizada exitosamente',
                data: assessment,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error actualizando evaluación:', error);
            throw new InternalServerErrorException('Error interno actualizando la evaluación');
        }
    }

    // ==================== ENDPOINTS DE PREGUNTAS ====================

    @Get(':id/questions')
    async getQuestions(
        @Req() request: AuthenticatedRequest,
        @Param('id') assessmentId: string,
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

            const questions = await this.questionsService.getQuestionsByAssessment(
                assessmentId,
                tenantId
            );

            return {
                success: true,
                message: 'Preguntas obtenidas exitosamente',
                data: questions,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error obteniendo preguntas:', error);
            throw new InternalServerErrorException('Error interno obteniendo las preguntas');
        }
    }

    @Post(':id/questions')
    async saveQuestions(
        @Req() request: AuthenticatedRequest,
        @Param('id') assessmentId: string,
        @Body('questions') questions: CreateQuestionDto[],
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

            const savedQuestions = await this.questionsService.saveQuestions(
                assessmentId,
                tenantId,
                questions
            );

            return {
                success: true,
                message: 'Preguntas guardadas exitosamente',
                data: savedQuestions,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error guardando preguntas:', error);
            throw new InternalServerErrorException('Error interno guardando las preguntas');
        }
    }

    @Delete(':id/questions/:questionId')
    async deleteQuestion(
        @Req() request: AuthenticatedRequest,
        @Param('id') assessmentId: string,
        @Param('questionId') questionId: string,
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

            await this.questionsService.deleteQuestion(
                questionId,
                assessmentId,
                tenantId
            );

            return {
                success: true,
                message: 'Pregunta eliminada exitosamente',
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error eliminando pregunta:', error);
            throw new InternalServerErrorException('Error interno eliminando la pregunta');
        }
    }

}
// src/activities/games/complete-phrase/complete-phrase.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    UseInterceptors,
    BadRequestException,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompletePhraseService } from './complete-phrase.service';
import { CreateCompletePhraseDto, UpdateCompletePhraseDto } from './dto/create-complete-phrase.dto';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { UserProgressService } from 'src/progress/services/user-progress.service';
import { ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';

@Controller('complete-phrase')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class CompletePhraseController {
    constructor(
        private readonly completePhraseService: CompletePhraseService,
        private readonly progressService: UserProgressService
    ) {}

    /**
     * Crea un juego de completar frases para una actividad
     */
    @Post('activity/:activityId')
    async create(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() createDto: CreateCompletePhraseDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const completePhrase = await this.completePhraseService.create(
                activityId,
                createDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Juego de completar frases creado exitosamente',
                data: completePhrase,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene la configuración de un juego de completar frases
     */
    @Get('activity/:activityId')
    async getByActivityId(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const completePhrase = await this.completePhraseService.getByActivityId(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Juego de completar frases obtenido exitosamente',
                data: completePhrase,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Genera los datos para jugar (sin revelar respuestas)
     */
    @Get('activity/:activityId/play')
    async generatePlayableData(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Query('fromModule') isFromModule: boolean,
        @Query('phraseIndex', new ParseIntPipe({ optional: true })) phraseIndex?: number,
    ) {
        try {
            const tenantId = request.tenant?.id;
            const userId = request.user?.['id'];

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            if (!userId) {
                throw new BadRequestException('Usuario no autenticado');
            }

            const gameData = await this.completePhraseService.generatePlayableData(
                activityId,
                tenantId,
                phraseIndex,
            );

            if (isFromModule) {
                await this.progressService.startItemProgress(activityId, userId, ModuleItemType.ACTIVITY,);
            }

            return {
                success: true,
                message: 'Datos de juego generados exitosamente',
                data: gameData,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Valida un intento de usuario
     */
    @Post('activity/:activityId/validate')
    async validateAttempt(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() body: {
            phraseIndex: number;
            answers: Array<{ blankId: number; answer: string }>;
            hintsUsed: number;
        },
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const result = await this.completePhraseService.validateAttempt(
                activityId,
                tenantId,
                body.phraseIndex,
                body.answers,
                body.hintsUsed,
            );

            return {
                success: true,
                message: 'Intento validado exitosamente',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene una pista para un blanco específico
     */
    @Get('activity/:activityId/hint/:phraseIndex/:blankId')
    async getHint(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Param('phraseIndex', ParseIntPipe) phraseIndex: number,
        @Param('blankId', ParseIntPipe) blankId: number,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const hint = await this.completePhraseService.getHint(
                activityId,
                tenantId,
                phraseIndex,
                blankId,
            );

            return {
                success: true,
                message: 'Pista obtenida exitosamente',
                data: hint,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualiza un juego de completar frases
     */
    @Put('activity/:activityId')
    async update(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() updateDto: UpdateCompletePhraseDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const completePhrase = await this.completePhraseService.update(
                activityId,
                updateDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Juego de completar frases actualizado exitosamente',
                data: completePhrase,
            };
        } catch (error) {
            throw error;
        }
    }
}
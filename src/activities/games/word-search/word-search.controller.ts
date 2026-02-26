// src/activities/games/word-search/word-search.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Req,
    UseGuards,
    UseInterceptors,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WordSearchService } from './word-search.service';
import { CreateWordSearchDto, UpdateWordSearchDto } from './dto/create-word-search.dto';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { UserProgressService } from 'src/progress/services/user-progress.service';
import { ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';

@Controller('word-search')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class WordSearchController {
    constructor(
        private readonly wordSearchService: WordSearchService,
        private readonly progressService: UserProgressService
    ) {}

    /**
     * Crea un juego de sopa de letras para una actividad
     */
    @Post('activity/:activityId')
    async create(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() createDto: CreateWordSearchDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const wordSearch = await this.wordSearchService.create(
                activityId,
                createDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Sopa de letras creada exitosamente',
                data: wordSearch,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene la configuración de una sopa de letras
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

            const wordSearch = await this.wordSearchService.getByActivityId(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Sopa de letras obtenida exitosamente',
                data: wordSearch,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Genera el grid para jugar (sin revelar posiciones)
     */
    @Get('activity/:activityId/play')
    async generatePlayableGrid(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Query('fromModule') isFromModule: boolean,
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

            const gridData = await this.wordSearchService.generatePlayableGrid(
                activityId,
                tenantId,
            );

            if (isFromModule) {
                await this.progressService.startItemProgress(activityId, userId, ModuleItemType.ACTIVITY,);
            }

            return {
                success: true,
                message: 'Grid generado exitosamente',
                data: gridData,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Genera el grid completo para administradores
     */
    @Get('activity/:activityId/admin-grid')
    async generateAdminGrid(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const gridData = await this.wordSearchService.generateAdminGrid(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Grid completo generado exitosamente',
                data: gridData,
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
            foundWords: Array<{
                word: string;
                startRow: number;
                startCol: number;
                endRow: number;
                endCol: number;
            }>;
        },
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const result = await this.wordSearchService.validateAttempt(
                activityId,
                tenantId,
                body.foundWords,
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
     * Actualiza una sopa de letras
     */
    @Put('activity/:activityId')
    async update(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() updateDto: UpdateWordSearchDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const wordSearch = await this.wordSearchService.update(
                activityId,
                updateDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Sopa de letras actualizada exitosamente',
                data: wordSearch,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Regenera el seed para crear un nuevo tablero
     */
    @Post('activity/:activityId/regenerate-seed')
    async regenerateSeed(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const wordSearch = await this.wordSearchService.regenerateSeed(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Seed regenerado exitosamente. Se ha creado un nuevo tablero.',
                data: wordSearch,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene una pista para una palabra
     */
    @Get('activity/:activityId/hint/:wordIndex')
    async getHint(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Param('wordIndex') wordIndex: string,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const hint = await this.wordSearchService.getHint(
                activityId,
                tenantId,
                parseInt(wordIndex),
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
}
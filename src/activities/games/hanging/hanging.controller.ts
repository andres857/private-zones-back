// src/activities/games/hanging/hanging.controller.ts
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
import { HangingService } from './hanging.service';
import { CreateHangingDto, UpdateHangingDto } from './dto/create-hanging.dto';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';

@Controller('hanging')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class HangingController {
    constructor(private readonly hangingService: HangingService) {}

    /**
     * Crea un juego de ahorcado para una actividad
     */
    @Post('activity/:activityId')
    async create(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() createDto: CreateHangingDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const hanging = await this.hangingService.create(
                activityId,
                createDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Juego de ahorcado creado exitosamente',
                data: hanging,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene la configuración de un juego de ahorcado
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

            const hanging = await this.hangingService.getByActivityId(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Juego de ahorcado obtenido exitosamente',
                data: hanging,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Genera los datos para jugar (sin revelar la palabra)
     */
    @Get('activity/:activityId/play')
    async generatePlayableData(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Query('wordIndex', new ParseIntPipe({ optional: true })) wordIndex?: number,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const gameData = await this.hangingService.generatePlayableData(
                activityId,
                tenantId,
                wordIndex,
            );

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
            wordIndex: number;
            guessedLetters: string[];
            hintsUsed: number;
        },
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const result = await this.hangingService.validateAttempt(
                activityId,
                tenantId,
                body.wordIndex,
                body.guessedLetters,
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
     * Obtiene una pista para el jugador
     */
    @Get('activity/:activityId/hint/:wordIndex')
    async getHint(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Param('wordIndex', ParseIntPipe) wordIndex: number,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const hint = await this.hangingService.getHint(
                activityId,
                tenantId,
                wordIndex,
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
     * Actualiza un juego de ahorcado
     */
    @Put('activity/:activityId')
    async update(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() updateDto: UpdateHangingDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const hanging = await this.hangingService.update(
                activityId,
                updateDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Juego de ahorcado actualizado exitosamente',
                data: hanging,
            };
        } catch (error) {
            throw error;
        }
    }
}
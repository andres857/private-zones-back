// src/activities/games/crossword/crossword.controller.ts
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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrosswordService } from './crossword.service';
import { CreateCrosswordDto, UpdateCrosswordDto } from './dto/create-crossword.dto';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { CrosswordDirection } from './entities/crossword.entity';

@Controller('crossword')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class CrosswordController {
    constructor(private readonly crosswordService: CrosswordService) {}

    /**
     * Crea un crucigrama para una actividad
     */
    @Post('activity/:activityId')
    async create(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() createDto: CreateCrosswordDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const crossword = await this.crosswordService.create(
                activityId,
                createDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Crucigrama creado exitosamente',
                data: crossword,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene la configuración de un crucigrama
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

            const crossword = await this.crosswordService.getByActivityId(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Crucigrama obtenido exitosamente',
                data: crossword,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Genera el grid para jugar
     */
    @Get('activity/:activityId/play')
    async generatePlayableGrid(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const gridData = await this.crosswordService.generatePlayableGrid(
                activityId,
                tenantId,
            );

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
     * Valida un intento de usuario
     */
    @Post('activity/:activityId/validate')
    async validateAttempt(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() body: {
            answers: Array<{
                number: number;
                direction: CrosswordDirection;
                answer: string;
            }>;
            checksUsed: number;
            hintsUsed: number;
        },
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const result = await this.crosswordService.validateAttempt(
                activityId,
                tenantId,
                body.answers,
                body.checksUsed,
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
     * Verifica una letra específica
     */
    @Post('activity/:activityId/check-letter')
    async checkLetter(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() body: {
            row: number;
            col: number;
            letter: string;
        },
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const result = await this.crosswordService.checkLetter(
                activityId,
                tenantId,
                body.row,
                body.col,
                body.letter,
            );

            return {
                success: true,
                message: 'Letra verificada',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verifica una palabra completa
     */
    @Post('activity/:activityId/check-word')
    async checkWord(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() body: {
            number: number;
            direction: CrosswordDirection;
            answer: string;
        },
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const result = await this.crosswordService.checkWord(
                activityId,
                tenantId,
                body.number,
                body.direction,
                body.answer,
            );

            return {
                success: true,
                message: 'Palabra verificada',
                data: result,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene una pista para una palabra
     */
    @Get('activity/:activityId/hint/:number/:direction')
    async getHint(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Param('number') number: string,
        @Param('direction') direction: CrosswordDirection,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const hint = await this.crosswordService.getHint(
                activityId,
                tenantId,
                parseInt(number),
                direction,
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
     * Actualiza un crucigrama
     */
    @Put('activity/:activityId')
    async update(
        @Req() request: AuthenticatedRequest,
        @Param('activityId') activityId: string,
        @Body() updateDto: UpdateCrosswordDto,
    ) {
        try {
            const tenantId = request.tenant?.id;

            if (!tenantId) {
                throw new BadRequestException('Tenant no validado');
            }

            const crossword = await this.crosswordService.update(
                activityId,
                updateDto,
                tenantId,
            );

            return {
                success: true,
                message: 'Crucigrama actualizado exitosamente',
                data: crossword,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Regenera el seed
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

            const crossword = await this.crosswordService.regenerateSeed(
                activityId,
                tenantId,
            );

            return {
                success: true,
                message: 'Seed regenerado exitosamente',
                data: crossword,
            };
        } catch (error) {
            throw error;
        }
    }
}
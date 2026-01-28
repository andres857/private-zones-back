// src/activities/activities.controller.ts
import {
    BadRequestException, Body, Controller, DefaultValuePipe, Get,
    InternalServerErrorException, NotFoundException, Param, ParseIntPipe,
    Post, Put, Query, Req, UseGuards, UseInterceptors
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityType } from './entities/activity.entity';

@Controller('activities')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ActivitiesController {
    constructor(
        private readonly activitiesService: ActivitiesService,
    ) { }

    @Get('course/:courseId')
    async getAllByCourse(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('actives') actives?: boolean,
        @Query('type') type?: ActivityType,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
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

            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 50);

            const result = await this.activitiesService.getAllByCourse({
                courseId,
                search,
                actives,
                type,
                page: validPage,
                limit: validLimit,
                tenantId,
            });

            return {
                success: true,
                message: 'Actividades obtenidas exitosamente',
                data: result.data,
                pagination: result.pagination,
                stats: result.stats,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error obteniendo actividades:', error);
            throw new InternalServerErrorException('Error interno obteniendo las actividades');
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

            const activity = await this.activitiesService.getById(id, tenantId);

            return {
                success: true,
                message: 'Actividad obtenida exitosamente',
                data: activity,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error obteniendo actividad:', error);
            throw new InternalServerErrorException('Error interno obteniendo la actividad');
        }
    }

    @Post()
    async createActivity(
        @Req() request: AuthenticatedRequest,
        @Body() createActivityDto: CreateActivityDto,
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

            const activity = await this.activitiesService.create({
                ...createActivityDto,
                tenantId,
            });

            return {
                success: true,
                message: 'Actividad creada exitosamente',
                data: activity,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error creando actividad:', error);
            throw new InternalServerErrorException('Error interno creando la actividad');
        }
    }

    @Put(':id')
    async update(
        @Req() request: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() updateActivityDto: UpdateActivityDto,
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

            const activity = await this.activitiesService.update(id, {
                ...updateActivityDto,
                tenantId,
            });

            return {
                success: true,
                message: 'Actividad actualizada exitosamente',
                data: activity,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error actualizando actividad:', error);
            throw new InternalServerErrorException('Error interno actualizando la actividad');
        }
    }
}

import { Body, Controller, Get, Post, UseInterceptors, Headers, Param, UseGuards, Req, Query, DefaultValuePipe, ParseIntPipe, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException, Put } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('courses')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class CoursesController {
    constructor(
        private readonly service: CoursesService,
        private readonly coursesService: CoursesService
    ) { }

    // @UseInterceptors(
    //   TenantValidationInterceptor // Interceptor de tenant
    // )
    @Get('/tenant')
    async findByTenant(@Headers('x-tenant-domain') tenantDomain: string) {
        console.log(`Buscando cursos para el tenant: ${tenantDomain}`);
        return this.service.findByTenant(tenantDomain);
    }

    @Post()
    async create(@Body() dto: CreateCourseDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string, 
        @Body() dto: CreateCourseDto
    ) {
    try {
        console.log(`Actualizando curso con ID: ${id}`);
        console.log(dto);
        return await this.service.update(id, dto);
    } catch (error) {
            // Si ya es un HttpException, se relanza
            if (error instanceof HttpException) {
                throw error;
            }

            console.error('Unexpected error in update:', error);

            throw new HttpException(
                'Internal server error',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    @Get()
    async findAll(
        @Req() request: AuthenticatedRequest,
        @Headers('x-tenant-domain') tenantDomain: string,
        @CurrentUser() user: any,
        @Query('search') search?: string,
        @Query('actives') actives?: boolean,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ) {
        try {
            const userId = request.user?.['id'];
            const tenantId = request.tenant?.id;

            // 🛡️ Validaciones con errores específicos de HTTP
            if (!userId) {
                throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
            }
            
            if (!tenantId) {
                throw new HttpException('Tenant not validated', HttpStatus.FORBIDDEN);
            }

            if (!tenantDomain?.trim()) {
                throw new HttpException('Tenant domain header is required', HttpStatus.BAD_REQUEST);
            }

            // 📌 Validar que page y limit sean valores válidos
            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 50);

            // 🔍 Validar rango razonable para page (opcional)
            if (validPage > 1000) {
                throw new HttpException('Page number too large', HttpStatus.BAD_REQUEST);
            }

            return this.coursesService.findAll({
                search,
                actives,
                page: validPage,
                limit: validLimit,
                userId,
                tenantId
            });

        } catch (error) {
            // 🚨 Si es HttpException, la dejamos pasar tal como está
            if (error instanceof HttpException) {
                throw error;
            }

            // 🚨 Para cualquier otro error, lo convertimos a error interno del servidor
            console.error('Unexpected error in findAll:', error);
            throw new HttpException(
                'Internal server error', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    @Get('/home')
    async forHome(
        @Req() request: AuthenticatedRequest,
        @Headers('x-tenant-domain') tenantDomain: string,
        @CurrentUser() user: any,
        @Query('search') search?: string,
        @Query('actives') actives?: boolean,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ) {
        try {
            const userId = request.user?.['id'];
            const tenantId = request.tenant?.id;

            // 🛡️ Validaciones con errores específicos de HTTP
            if (!userId) {
                throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
            }
            
            if (!tenantId) {
                throw new HttpException('Tenant not validated', HttpStatus.FORBIDDEN);
            }

            if (!tenantDomain?.trim()) {
                throw new HttpException('Tenant domain header is required', HttpStatus.BAD_REQUEST);
            }

            // 📌 Validar que page y limit sean valores válidos
            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 50);

            // 🔍 Validar rango razonable para page (opcional)
            if (validPage > 1000) {
                throw new HttpException('Page number too large', HttpStatus.BAD_REQUEST);
            }

            // ✅ Llamar al método correcto del servicio
            return await this.coursesService.findForHome({
                search,
                actives,
                page: validPage,
                limit: validLimit,
                userId,
                tenantId
            });

        } catch (error) {
            // 🚨 Si es HttpException, la dejamos pasar tal como está
            if (error instanceof HttpException) {
                throw error;
            }

            // 🚨 Para cualquier otro error, lo convertimos a error interno del servidor
            console.error('Unexpected error in forHome:', error);
            throw new HttpException(
                'Internal server error', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // @UseInterceptors(
    //   TenantValidationInterceptor // Interceptor de tenant
    // )
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(
        @Headers('x-tenant-domain') tenantDomain: string,
        @Param('id') id: string,
        @CurrentUser() user: any
    ) {
        // Validar que se haya proporcionado el ID
        if (!id || id.trim() === '') {
            return {
                error: true,
                message: 'No se ha proporcionado un parámetro ID válido'
            };
        }

        const userId = user.id;

        console.log(`Buscando curso con ID: ${id} para el tenant: ${tenantDomain}`);
        return this.service.findCourseForMake(id, tenantDomain, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':courseId/progress')
    async getUserProgress(
        @Param('courseId') courseId: string,
        @Req() request: Request
    ) {
        const userId = request.user?.['id']; // Asume que el user ID viene del JWT

        if (!userId) {
            throw new Error('User not authenticated');
        }

        return await this.service.getUserProgress(courseId, userId);
    }

    // ruta sin parámetros para manejar el caso cuando no se proporciona ID
    // @UseInterceptors(
    //   TenantValidationInterceptor // Interceptor de tenant
    // )
    // @Get()
    // async findWithoutId() {
    //   return {
    //     error: true,
    //     message: 'No se ha proporcionado un parámetro ID. Uso correcto: /courses/{id}'
    //   };
    // }

    
}

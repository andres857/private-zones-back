import { Body, Controller, DefaultValuePipe, Get, InternalServerErrorException, Param, ParseIntPipe, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { ForumsService } from './forums.service';

@Controller('forums')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ForumsController {

    constructor(
        private readonly forumsService: ForumsService,
    ) { }

    @Post('/create')
    async createForum(@Req() request: AuthenticatedRequest, @Body() body: any){
        try {

            const savedForum = await this.forumsService.createForum(body);

            return {
                success: true,
                message: 'Foro creado exitosamente',
                data: {
                    id: savedForum.id,
                    title: savedForum.title,
                    tenantId: savedForum.tenantId,
                    createdAt: savedForum.createdAt
                }
            }
        } catch (error) {
            throw error;
        }
    }

    @Get('course/:courseId')
    async getAllForums(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ) {
        try {

            const userId = request.user?.['id'];
            const tenantId = request.tenant?.id;

            if (!userId) throw new Error('User not authenticated');
            if (!tenantId) throw new Error('Tenant not validated');

            // 📌 Validar que page y limit sean valores válidos
            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 100); // máximo 100 por página

            const forums = await this.forumsService.getAll({
                courseId,
                search,
                page: validPage,
                limit: validLimit,
                userId,
                tenantId,
            });
        } catch (error) {
            console.error('Error obteniendo foros:', error);
            throw new InternalServerErrorException('Error interno obteniendo los foros');
        }
    }




    

}

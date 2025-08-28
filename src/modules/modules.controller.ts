import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Req } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';

@Controller('modules')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ModulesController {
    constructor(private readonly modulesService: ModulesService) { }

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
    
            if (!userId) throw new Error('User not authenticated');
            if (!tenantId) throw new Error('Tenant not validated');
    
            // 📌 Validar que page y limit sean valores válidos
            const validPage = Math.max(1, page || 1);
            const validLimit = Math.min(Math.max(1, limit || 12), 50); // máximo 50 por página
    
            return this.modulesService.getAll({
                courseId,
                search,
                actives,
                page: validPage,
                limit: validLimit,
                userId,
                tenantId,
            });
        } catch (error) {
            throw error;
        }
    }

    @Post('/create')
    async createModule(@Req() request: AuthenticatedRequest, @Body() createModuleDto: CreateModuleDto) {
        try {
            const savedModule = await this.modulesService.createModule(createModuleDto);

            // Retornar respuesta exitosa con el modulo creado
            return{
                success: true,
                message: 'Modulo creado exitosamente',
                data: {
                    id: savedModule.id,
                    title: savedModule.title,
                    description: savedModule.description,
                    courseId: savedModule.courseId,
                    createdAt: savedModule.createdAt,
                    updatedAt: savedModule.updatedAt,
                }
            }
        } catch (error) {
            throw error;
        }
    }

    @Get()
    findAll() {
        return this.modulesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.modulesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
        return this.modulesService.update(+id, updateModuleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.modulesService.remove(+id);
    }
}

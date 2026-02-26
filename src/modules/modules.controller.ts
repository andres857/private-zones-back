import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    UseGuards, UseInterceptors, Query, DefaultValuePipe,
    ParseIntPipe, Req, BadRequestException
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AuthGuard } from '@nestjs/passport';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { AddModuleItemDto } from './dto/add-module-item.dto';

@Controller('modules')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ModulesController {
    constructor(private readonly modulesService: ModulesService) {}

    @Get('course/:courseId')
    async getAllByCourse(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('actives') actives?: boolean,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ) {
        const userId = request.user?.['id'];
        const tenantId = request.tenant?.id;

        if (!userId) throw new BadRequestException('User not authenticated');
        if (!tenantId) throw new BadRequestException('Tenant not validated');

        const validPage = Math.max(1, page || 1);
        const validLimit = Math.min(Math.max(1, limit || 12), 50);

        return this.modulesService.getAll({
            courseId,
            search,
            actives,
            page: validPage,
            limit: validLimit,
            userId,
            tenantId,
        });
    }

    @Post('/create')
    async createModule(
        @Req() request: AuthenticatedRequest,
        @Body() createModuleDto: CreateModuleDto,
    ) {
        const savedModule = await this.modulesService.createModule(createModuleDto);

        return {
            success: true,
            message: 'Modulo creado exitosamente',
            data: {
                id: savedModule.id,
                title: savedModule.title,
                description: savedModule.description,
                courseId: savedModule.courseId,
                createdAt: savedModule.createdAt,
                updatedAt: savedModule.updatedAt,
            },
        };
    }

    @Get()
    findAll() {
        return this.modulesService.findAll();
    }

    // Retorna todos los ítems del módulo con sus datos referenciados resueltos
    @Get(':moduleId/items')
    async getModuleItems(
        @Req() request: AuthenticatedRequest,
        @Param('moduleId') moduleId: string,
    ) {
        const tenantId = request.tenant?.id;
        if (!tenantId) throw new BadRequestException('Tenant no validado');

        const data = await this.modulesService.getModuleItems(moduleId, tenantId);

        return {
            success: true,
            data: data,
        };
    }

    @Post(':moduleId/items')
    async addModuleItem(
        @Req() request: AuthenticatedRequest,
        @Param('moduleId') moduleId: string,
        @Body() dto: AddModuleItemDto,
    ) {
        const tenantId = request.tenant?.id;
        if (!tenantId) throw new BadRequestException('Tenant no validado');

        const item = await this.modulesService.addModuleItem(moduleId, dto, tenantId);

        return {
            success: true,
            message: 'Ítem agregado al módulo correctamente',
            data: {
                id: item.id,
                moduleId: item.moduleId,
                type: item.type,
                referenceId: item.referenceId,
                order: item.order,
            },
        };
    }

    @Delete(':moduleId/items/:itemId')
    async removeModuleItem(
        @Req() request: AuthenticatedRequest,
        @Param('moduleId') moduleId: string,
        @Param('itemId') itemId: string,
    ) {
        const tenantId = request.tenant?.id;
        if (!tenantId) throw new BadRequestException('Tenant no validado');

        await this.modulesService.removeModuleItem(moduleId, itemId, tenantId);

        return {
            success: true,
            message: 'Ítem eliminado del módulo correctamente',
        };
    }

    @Get(':id')
    async findOne(
        @Req() request: AuthenticatedRequest,
        @Param('id') id: string,
        @Query('includeContents') includeContents?: string,
    ) {
        const tenantId = request.tenant?.id;
        if (!tenantId) throw new BadRequestException('Tenant no validado');

        const withContents = includeContents === 'true' || includeContents === '1';

        const module = withContents
            ? await this.modulesService.findOneWithContents(id, tenantId)
            : await this.modulesService.findOne(id, tenantId);

        return {
            success: true,
            data: module,
        };
    }

    @Get(':courseId/available-items')
    async getAvailableItems(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
    ) {
        const tenantId = request.tenant?.id;
        if (!tenantId) throw new BadRequestException('Tenant no validado');
        return this.modulesService.getAvailableItemsByCourse(courseId, tenantId);
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
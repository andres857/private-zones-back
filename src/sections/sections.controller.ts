import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import { FilterSectionsDto, SectionListResponseDto, SectionStatsDto } from './dto/filter-sections.dto';
import { SectionsService } from './sections.service';
import { Section } from './entities/sections.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Courses } from 'src/courses/entities/courses.entity';

@Controller('sections')
export class SectionsController {

    constructor(private readonly sectionsService: SectionsService) {}
      
    private readonly logger = new Logger(SectionsController.name);

    // @UseInterceptors(
    //     TenantValidationInterceptor // Interceptor de tenant
    // )
    @Get()
    async findAll(@Query() filters: FilterSectionsDto, @Req() request: Request): Promise<SectionListResponseDto> {
        return this.sectionsService.findAllWithFilters(filters, request);
    }

    @Get('stats')
    async getUserStats(): Promise<SectionStatsDto> {
        return this.sectionsService.getSectionsStats();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Section> {
        return this.sectionsService.findOne(id);
    }

    @UseInterceptors(
        TenantValidationInterceptor // Interceptor de tenant
    )
    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createSection(@Body() createSectionDto: CreateSectionDto): Promise<Section> {
        return this.sectionsService.createSectionWithCourses(createSectionDto);
    }

    @UseInterceptors(TenantValidationInterceptor)
    @Put(':id/update')
    @HttpCode(HttpStatus.OK)
    async updateSection(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateSectionDto: UpdateSectionDto
    ): Promise<Section> {
        return this.sectionsService.updateSectionWithCourses(id, updateSectionDto);
    }

    @Get('check-slug/:slug')
    async checkSlugExists(@Param('slug') slug: string): Promise<{ exists: boolean }> {
        const exists = await this.sectionsService.checkSlugExists(slug);
        return { exists };
    }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post, Query, UseInterceptors } from '@nestjs/common';
import { FilterSectionsDto, SectionListResponseDto, SectionStatsDto } from './dto/filter-sections.dto';
import { SectionsService } from './sections.service';
import { Section } from './entities/sections.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Controller('sections')
export class SectionsController {

    constructor(private readonly sectionsService: SectionsService) {}
      
    private readonly logger = new Logger(SectionsController.name);

    @Get()
    async findAll(@Query() filters: FilterSectionsDto): Promise<SectionListResponseDto> {
        return this.sectionsService.findAllWithFilters(filters);
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
        return this.sectionsService.createSection(createSectionDto);
    }
}

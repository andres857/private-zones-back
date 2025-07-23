import { Controller, Get, Logger, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { FilterSectionsDto, SectionListResponseDto, SectionStatsDto } from './dto/filter-sections.dto';
import { SectionsService } from './sections.service';
import { Section } from './entities/sections.entity';

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
}

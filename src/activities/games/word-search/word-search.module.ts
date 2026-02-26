// src/activities/games/word-search/word-search.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordSearchController } from './word-search.controller';
import { WordSearchService } from './word-search.service';
import { WordSearchGeneratorService } from './word-search-generator.service';
import { WordSearchGame } from './entities/word-search.entity';
import { Activity } from '../../entities/activity.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { ActivityConfiguration } from 'src/activities/entities/activity-config.entity';
import { UsersProgressModule } from 'src/progress/user-progress.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WordSearchGame,
            Activity,
            ActivityConfiguration
        ]),
        TenantsModule,
        UsersProgressModule
    ],
    controllers: [WordSearchController],
    providers: [
        WordSearchService,
        WordSearchGeneratorService,
        TenantValidationInterceptor,
    ],
    exports: [WordSearchService, WordSearchGeneratorService],
})
export class WordSearchModule { }
// src/activities/games/crossword/crossword.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrosswordController } from './crossword.controller';
import { CrosswordService } from './crossword.service';
import { CrosswordGame } from './entities/crossword.entity';
import { Activity } from '../../entities/activity.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CrosswordGame,
            Activity,
        ]),
        TenantsModule,
    ],
    controllers: [CrosswordController],
    providers: [
        CrosswordService,
        TenantValidationInterceptor,
    ],
    exports: [CrosswordService],
})
export class CrosswordModule { }
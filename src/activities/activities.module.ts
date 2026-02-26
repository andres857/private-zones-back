// src/activities/activities.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';
import { Activity } from './entities/activity.entity';
import { ActivityConfiguration } from './entities/activity-config.entity';
import { ActivityTranslation } from './entities/activity-translation.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { WordSearchModule } from './games/word-search/word-search.module';
import { HangingModule } from './games/hanging/hanging.module';
import { CompletePhraseModule } from './games/complete-phrase/complete-phrase.module';
import { CrosswordModule } from './games/crossword/crossword.module';
import { UsersProgressModule } from 'src/progress/user-progress.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Activity,
            ActivityConfiguration,
            ActivityTranslation,
            ActivityAttempt,
            Courses,
        ]),
        TenantsModule,
        UsersProgressModule,
        forwardRef(() => WordSearchModule),
        forwardRef(() => HangingModule),
        forwardRef(() => CompletePhraseModule),
        forwardRef(() => CrosswordModule),
    ],
    controllers: [ActivitiesController],
    providers: [ActivitiesService, TenantValidationInterceptor],
    exports: [ActivitiesService],
})
export class ActivitiesModule { }
// src/activities/games/complete-phrase/complete-phrase.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompletePhraseController } from './complete-phrase.controller';
import { CompletePhraseService } from './complete-phrase.service';
import { CompletePhraseGame } from './entities/complete-phrase.entity';
import { Activity } from '../../entities/activity.entity';
import { ActivityConfiguration } from '../../entities/activity-config.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CompletePhraseGame,
            Activity,
            ActivityConfiguration,
        ]),
        TenantsModule,
    ],
    controllers: [CompletePhraseController],
    providers: [
        CompletePhraseService,
        TenantValidationInterceptor,
    ],
    exports: [CompletePhraseService],
})
export class CompletePhraseModule { }
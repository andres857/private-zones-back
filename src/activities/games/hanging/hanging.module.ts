// src/activities/games/hanging/hanging.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HangingController } from './hanging.controller';
import { HangingService } from './hanging.service';
import { HangingGame } from './entities/hanging.entity';
import { Activity } from '../../entities/activity.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            HangingGame,
            Activity,
        ]),
        TenantsModule,
    ],
    controllers: [HangingController],
    providers: [
        HangingService,
        TenantValidationInterceptor,
    ],
    exports: [HangingService],
})
export class HangingModule { }
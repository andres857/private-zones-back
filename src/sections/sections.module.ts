import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entities/sections.entity';
import { TenantsService } from 'src/tenants/tenants.service';
import { TenantsModule } from 'src/tenants/tenants.module';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Section]), TenantsModule],
  controllers: [SectionsController],
  providers: [SectionsService, TenantValidationInterceptor]
})
export class SectionsModule {}

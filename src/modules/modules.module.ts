import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courses } from 'src/courses/entities/courses.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Courses,
      CourseModule
    ]),
    TenantsModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService, TenantValidationInterceptor],
})
export class ModulesModule { }

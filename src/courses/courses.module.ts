// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Courses } from './entities/courses.entity';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';
import { CourseModule } from './entities/courses-modules.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Courses, CourseModule]), TenantsModule],
  controllers: [CoursesController],
  providers: [CoursesService, TenantValidationInterceptor],
})
export class CoursesModule {}

// src/contents/contents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { ContentItem } from './entities/courses-contents.entity';
import { ModuleItem } from '../courses/entities/courses-modules-item.entity';
import { CourseModule } from '../courses/entities/courses-modules.entity';
import { Courses } from '../courses/entities/courses.entity';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';
import { UsersProgressModule } from 'src/progress/user-progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentItem,
      ModuleItem,
      CourseModule,
      Courses,
    ]),
    TenantsModule,
    UsersProgressModule
  ],
  controllers: [ContentsController],
  providers: [ContentsService, TenantValidationInterceptor],
  exports: [ContentsService]
})
export class ContentsModule {}
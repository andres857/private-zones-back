import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courses } from 'src/courses/entities/courses.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';
import { CourseModuleConfig } from 'src/courses/entities/courses-modules-config.entity';
import { ContentItem } from 'src/contents/entities/courses-contents.entity';
import { Forum } from 'src/forums/entities/forum.entity';
import { Task } from 'src/tasks/entities/courses-tasks.entity';
import { Assessment } from 'src/assessments/entities/assessment.entity';
import { Activity } from 'src/activities/entities/activity.entity';
import { ModuleItem } from 'src/courses/entities/courses-modules-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Courses,
      CourseModule,
      CourseModuleConfig,
      ContentItem,
      Forum,
      Task,
      Assessment,
      Activity,
      ModuleItem
    ]),
    TenantsModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService, TenantValidationInterceptor],
})
export class ModulesModule { }

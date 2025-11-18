// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Courses } from './entities/courses.entity';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';
import { CourseModule } from './entities/courses-modules.entity';
import { ContentItem } from '../contents/entities/courses-contents.entity';
import { Forum } from '../forums/entities/forum.entity';
import { Task } from './entities/courses-tasks.entity';
import { Quiz } from './entities/courses-quizzes.entity';
import { Survey } from './entities/courses-surveys.entity';
import { UserCourseProgress } from 'src/progress/entities/user-course-progress.entity';
import { UserModuleProgress } from 'src/progress/entities/user-module-progress.entity';
import { UserItemProgress } from 'src/progress/entities/user-item-progress.entity';
import { ModuleItem } from './entities/courses-modules-item.entity';
import { CourseConfiguration } from './entities/courses-config.entity';
import { CoursesUsers } from './entities/courses-users.entity';
import { CourseTranslation } from './entities/courses-translations.entity';
import { CoursesViewsConfig } from './entities/courses-view-config.entity';
import { TaskConfig } from './entities/courses-tasks-config.entity';
import { TaskSubmission } from './entities/courses-tasks-submissions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Courses, CourseModule, ContentItem, Forum, Task, Quiz, Survey, UserCourseProgress, UserModuleProgress, UserItemProgress, ModuleItem, CoursesUsers, CourseTranslation, CoursesViewsConfig, TaskConfig, TaskSubmission]), TenantsModule],
  controllers: [CoursesController],
  providers: [CoursesService, TenantValidationInterceptor],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule { }

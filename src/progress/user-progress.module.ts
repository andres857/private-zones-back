import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgressController } from './user-progress.controller';
import { UserProgressService } from './services/user-progress.service';
import { UserCourseProgress } from './entities/user-course-progress.entity';
import { UserModuleProgress } from './entities/user-module-progress.entity';
import { UserItemProgress } from './entities/user-item-progress.entity';
import { UserActivityLog } from 'src/users/entities/user-activity-log.entity';
import { UserSession } from './entities/user-session.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { CourseModule } from 'src/courses/entities/courses-modules.entity';
import { ModuleItem } from 'src/courses/entities/courses-modules-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCourseProgress, 
      UserModuleProgress, 
      UserItemProgress, 
      UserActivityLog, 
      UserSession,
      Courses,
      CourseModule,
      ModuleItem
    ])
  ],
  controllers: [UserProgressController],
  providers: [UserProgressService],
  exports: [UserProgressService, TypeOrmModule],
})
export class UsersProgressModule {}
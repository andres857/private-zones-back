import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courses } from 'src/courses/entities/courses.entity';
import { Task } from './entities/courses-tasks.entity';
import { TaskConfig } from './entities/courses-tasks-config.entity';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Courses,
      Task,
      TaskConfig,
    ]),
    TenantsModule
  ],
  controllers: [TasksController],
  providers: [TasksService, TenantValidationInterceptor],
})
export class TasksModule {}

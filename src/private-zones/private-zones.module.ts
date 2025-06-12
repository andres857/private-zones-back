import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './controllers/courses.controller';
import { CoursesService } from './services/course.service';

import { Course } from './entities/course.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Course]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  // exports: [UserService],
})
export class PrivateZonesModule {}
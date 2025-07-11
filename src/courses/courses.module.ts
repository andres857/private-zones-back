// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Courses } from './entities/courses.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Courses])],
  controllers: [CoursesController],
  // providers: [CoursesService],
})
export class CoursesModule {}

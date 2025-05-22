
import { Body, Controller, Post } from '@nestjs/common';
import { CreateCoursesDto } from './dto/create-courses.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.service.create(dto);
  }
}

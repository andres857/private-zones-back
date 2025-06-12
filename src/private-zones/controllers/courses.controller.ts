import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CoursesService } from '../services/course.service';
import { CreateCourseDto } from '../dtos/create-course.dto';

@Controller('private-zones/courses')
// export class UserController {
//   constructor(private readonly userService: UserService) {}

//   // @Get()
//   // async findAll(): Promise<User[]> {
//   //   return this.userService.findAll();
//   // }

//   @Get(':id')
//   async findById(@Param('id') id: number): Promise<User> {
//     return this.userService.findById(id);
//   }
// } 

export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.service.create(dto);
  }
}
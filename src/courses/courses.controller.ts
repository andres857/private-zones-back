
import { Body, Controller, Get, Post, UseInterceptors, Headers } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';

@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  // @UseInterceptors(
  //   TenantValidationInterceptor // Interceptor de tenant
  // )
  @Get('/tenant')
  async findByTenant(@Headers('x-tenant-domain') tenantDomain: string) {
    console.log(`Buscando cursos para el tenant: ${tenantDomain}`);
    return this.service.findByTenant(tenantDomain);
  }

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.service.create(dto);
  }
  
}

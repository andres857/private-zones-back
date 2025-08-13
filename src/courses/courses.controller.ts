
import { Body, Controller, Get, Post, UseInterceptors, Headers, Param, UseGuards, Req } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';

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


  // @UseInterceptors(
  //   TenantValidationInterceptor // Interceptor de tenant
  // )
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Headers('x-tenant-domain') tenantDomain: string,
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    // Validar que se haya proporcionado el ID
    if (!id || id.trim() === '') {
      return {
        error: true,
        message: 'No se ha proporcionado un parámetro ID válido'
      };
    }

    const userId = user.id;

    console.log(`Buscando curso con ID: ${id} para el tenant: ${tenantDomain}`);
    return this.service.findCourseForMake(id, tenantDomain, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':courseId/progress')
  async getUserProgress(
    @Param('courseId') courseId: string,
    @Req() request: Request
  ) {
    const userId = request.user?.['id']; // Asume que el user ID viene del JWT
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return await this.service.getUserProgress(courseId, userId);
  }

  // ruta sin parámetros para manejar el caso cuando no se proporciona ID
  // @UseInterceptors(
  //   TenantValidationInterceptor // Interceptor de tenant
  // )
  @Get()
  async findWithoutId() {
    return {
      error: true,
      message: 'No se ha proporcionado un parámetro ID. Uso correcto: /courses/{id}'
    };
  }
}

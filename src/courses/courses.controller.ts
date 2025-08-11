
import { Body, Controller, Get, Post, UseInterceptors, Headers, Param, UseGuards } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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

    console.log(user);

    const userId = user.id;

    console.log(`Buscando curso con ID: ${id} para el tenant: ${tenantDomain}`);
    return this.service.findCourseForMake(id, tenantDomain, userId);
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

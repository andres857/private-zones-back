import { Controller, Get, Post, Body, Param, ParseIntPipe, Delete, Query, Patch, ParseUUIDPipe, Logger, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';
import { FilterUsersDto, UserListResponseDto, UserStatsDto } from './dto/filter-users.dto';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  private readonly logger = new Logger(UsersController.name);

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.warn('Creacion de usuario');
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    this.logger.log(`Actualizando usuario: ${id}`);
    return this.usersService.update(id, updateUserDto);
  }

  @Get()
  async findAll(@Query() filters: FilterUsersDto): Promise<UserListResponseDto> {
    return this.usersService.findAllWithFilters(filters);
  }

  @Get('stats')
  async getUserStats(): Promise<UserStatsDto> {
    return this.usersService.getUserStats();
  }

  @Get('roles')
  async getAllRoles(): Promise<Array<{ id: string; name: string; description: string }>> {
    return this.usersService.getAllRoles();
  }

  @Get('tenants')
  async getAllTenants(): Promise<Array<{ id: string; name: string }>> {
    return this.usersService.getAllTenants();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.toggleActive(id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.delete(id);
  }

  @Post('assign-roles')
  async assignRoles(@Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(dto);
  }
} 
import { Controller, Get, Post, Body, Param, ParseIntPipe, Delete, Query, Patch, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';
import { FilterUsersDto, UserListResponseDto, UserStatsDto } from './dto/filter-users.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
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
  findOne(@Param('id', ParseIntPipe) id: string): Promise<User> {
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
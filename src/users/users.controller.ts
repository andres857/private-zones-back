import { Controller, Get, Post, Body, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
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
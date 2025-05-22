import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';

@Controller('private-zones/courses')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // async findAll(): Promise<User[]> {
  //   return this.userService.findAll();
  // }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<User> {
    return this.userService.findById(id);
  }
} 
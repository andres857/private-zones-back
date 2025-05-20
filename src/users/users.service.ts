import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In, DeepPartial } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto, roleEntities?: Role[]): Promise<User> {
    // Creamos un tipo que tiene roles opcional
    type UserDataType = Omit<CreateUserDto, 'roles'> & { roles?: Role[] };
    
    // Copiamos createUserDto sin roles
    const userDataWithoutRoles: Omit<CreateUserDto, 'roles'> = { ...createUserDto };
    // @ts-ignore - Eliminamos roles si existe
    if (createUserDto.roles) delete userDataWithoutRoles.roles;
    
    // Luego añadimos roles solo si tenemos roleEntities
    const userData: UserDataType = {
      ...userDataWithoutRoles
    };
    
    if (roleEntities) {
      userData.roles = roleEntities;
    }
  
    const user = this.usersRepository.create(userData as DeepPartial<User>);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name'],
    });
  
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }
    return user;
  }

  async findByEmailRegister(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name'],
    });
  
    return user;
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.usersRepository.delete(id);
  }

  async assignRoles(dto: AssignRolesDto): Promise<User> {
    const { userId, roleIds } = dto;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${userId} no encontrado`);
    }

    const roles = await this.rolesRepository.find({
      where: { id: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Uno o más roles no existen');
    }

    user.roles = roles; // reemplaza roles existentes
    return this.usersRepository.save(user);
  }
} 
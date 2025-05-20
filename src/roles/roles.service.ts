import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name } = createRoleDto;

    // Validar que no exista otro rol con el mismo nombre
    const existing = await this.rolesRepository.findOne({
      where: { name },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un rol con el nombre "${name}"`);
    }

    const role = this.rolesRepository.create(createRoleDto);
    return await this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.rolesRepository.findOne({ where: { name } });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    
    // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
    if (updateRoleDto.name) {
      const existing = await this.rolesRepository.findOne({
        where: { name: updateRoleDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Ya existe un rol con el nombre "${updateRoleDto.name}"`);
      }
    }

    Object.assign(role, updateRoleDto);
    return await this.rolesRepository.save(role);
  }

  async remove(id: string): Promise<DeleteResult> {
    return await this.rolesRepository.delete(id);
  }
} 
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In, DeepPartial, MoreThanOrEqual } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';
import { FilterUsersDto, UserListResponseDto, UserStatsDto } from './dto/filter-users.dto';
import { Tenant } from 'src/tenants/entities/tenant.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,

    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>
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

  async findAllWithFilters(filters: FilterUsersDto): Promise<UserListResponseDto> {
    const {
      search,
      role,
      isActive,
      tenantId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;

    // Crear query builder
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.profileConfig', 'profileConfig')
      .leftJoinAndSelect('user.notificationConfig', 'notificationConfig');

    // Aplicar filtros
    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere('role.name = :role', { role });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (tenantId) {
      queryBuilder.andWhere('user.tenantId = :tenantId', { tenantId });
    }

    // Aplicar ordenamiento
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    
    switch (sortBy) {
      case 'name':
        queryBuilder.orderBy('user.name', orderDirection);
        break;
      case 'email':
        queryBuilder.orderBy('user.email', orderDirection);
        break;
      case 'createdAt':
        queryBuilder.orderBy('user.createdAt', orderDirection);
        break;
      case 'updatedAt':
        queryBuilder.orderBy('user.updatedAt', orderDirection);
        break;
      default:
        queryBuilder.orderBy('user.createdAt', orderDirection);
    }

    // Aplicar paginación
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Obtener resultados y total
    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users.map(user => ({
        ...user,
        // Transformar roles a array de strings para compatibilidad con frontend
        roles: user.roles?.map(role => role.name) || []
      })),
      total,
      page,
      limit
    };
  }

  async getUserStats(): Promise<UserStatsDto> {
    // Total de usuarios
    const totalUsers = await this.usersRepository.count();

    // Usuarios activos e inactivos
    const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
    const inactiveUsers = totalUsers - activeUsers;

    // Usuarios nuevos este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await this.usersRepository.count({
      where: {
        createdAt: MoreThanOrEqual(startOfMonth)
      }
    });

    // Usuarios por rol
    const usersByRoleQuery = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .select('role.name', 'role')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .where('role.name IS NOT NULL')
      .groupBy('role.name')
      .getRawMany();

    const usersByRole = usersByRoleQuery.map(item => ({
      role: item.role,
      count: parseInt(item.count, 10)
    }));

    // Usuarios por tenant
    const usersByTenantQuery = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.tenant', 'tenant')
      .select('tenant.name', 'tenant')
      .addSelect('COUNT(user.id)', 'count')
      .where('tenant.name IS NOT NULL')
      .groupBy('tenant.name')
      .getRawMany();

    const usersByTenant = usersByTenantQuery.map(item => ({
      tenant: item.tenant,
      count: parseInt(item.count, 10)
    }));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      usersByRole,
      usersByTenant
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['roles', 'tenant', 'profileConfig', 'notificationConfig'] });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'isActive'],
      relations: ['roles']
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

  async toggleActive(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return await this.usersRepository.save(user);
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

  // Métodos auxiliares para el frontend
  async getAllRoles(): Promise<Array<{ id: string; name: string; description: string }>> {
    const roles = await this.rolesRepository.find({
      select: ['id', 'name', 'description']
    });
    
    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || `Rol ${role.name}`
    }));
  }

  async getAllTenants(): Promise<Array<{ id: string; name: string }>> {
    const tenants = await this.tenantsRepository
    .createQueryBuilder('tenant')
    .innerJoin('tenant.config', 'config')
    .where('config.status = :status', { status: true })
    .select(['tenant.id', 'tenant.name'])
    .getMany();
    
    return tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name
    }));
  }
} 
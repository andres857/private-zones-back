import { Injectable, NotFoundException, Logger, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In, DeepPartial, MoreThanOrEqual, Not } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { User } from './entities/user.entity';
import { CreateUserDto, CreateUserNotificationConfigDto, UpdateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';
import { FilterUsersDto, UserListResponseDto, UserStatsDto } from './dto/filter-users.dto';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import * as bcrypt from 'bcrypt';
import { UserNotificationConfig } from './entities/user-notification-config.entity';
import { UserProfileConfig, DocumentType } from './entities/user-profile-config.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserProfileConfig)
    private userProfileConfigRepository: Repository<UserProfileConfig>,

    @InjectRepository(UserNotificationConfig)
    private userNotificationConfigRepository: Repository<UserNotificationConfig>,

    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>
  ) {}

  private readonly logger = new Logger(UsersService.name);

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Verificar que el usuario existe
    const existingUser = await this.usersRepository.findOne({
      where: { id, tenantId: updateUserDto.tenantId },
      relations: ['roles', 'profileConfig', 'notificationConfig']
    });

    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se está actualizando el email, verificar que no exista otro usuario con ese email en el mismo tenant
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { 
          email: updateUserDto.email, 
          tenantId: existingUser.tenantId,
          id: Not(id) // Excluir el usuario actual
        }
      });

      if (emailExists) {
        throw new ConflictException('Ya existe un usuario con este email en este tenant');
      }
    }

    // Manejar actualización de roles si se proporcionan
    if (updateUserDto.roleIds) {
      const roles = await this.rolesRepository.findBy({
        id: In(updateUserDto.roleIds)
      });

      if (roles.length !== updateUserDto.roleIds.length) {
        throw new BadRequestException('Uno o más roles no son válidos');
      }

      existingUser.roles = roles;
    }

    // Actualizar configuración del perfil si se proporciona
    if (updateUserDto.profileConfig) {
      // Limpiar campos vacíos, null, undefined del profileConfig
      const cleanedProfileConfig = this.cleanEmptyFields(updateUserDto.profileConfig);
      
      if (existingUser.profileConfig) {
        // Actualizar configuración existente solo con campos válidos
        Object.assign(existingUser.profileConfig, cleanedProfileConfig);
      } else {
        // Crear nueva configuración solo con campos válidos
        const newProfileConfig = this.userProfileConfigRepository.create({
          ...cleanedProfileConfig,
          user: existingUser
        });
        existingUser.profileConfig = newProfileConfig;
      }
    }

    // Actualizar configuración de notificaciones si se proporciona
    if (updateUserDto.notificationConfig) {
      if (existingUser.notificationConfig) {
        // Actualizar configuración existente
        Object.assign(existingUser.notificationConfig, updateUserDto.notificationConfig);
      } else {
        // Crear nueva configuración
        const newNotificationConfig = this.userNotificationConfigRepository.create({
          ...updateUserDto.notificationConfig,
          user: existingUser
        });
        existingUser.notificationConfig = newNotificationConfig;
      }
    }

    // ✅ Hashear la contraseña si se proporciona
    if (updateUserDto.password) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      existingUser.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Actualizar campos principales del usuario (excluyendo roleIds y configuraciones que ya se manejaron)
    const { password, roleIds, profileConfig, notificationConfig, ...userUpdates } = updateUserDto;
    Object.assign(existingUser, userUpdates);

    // Guardar y retornar
    return await this.usersRepository.save(existingUser);
  }

  // ✅ Método helper para limpiar campos vacíos
  private cleanEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: any = {};
    
    for (const key in obj) {
      const value = obj[key];
      
      // Saltar valores null, undefined o strings vacíos
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      // Para campos de fecha, validar que sean fechas válidas
      if (key.toLowerCase().includes('date') || key === 'dateOfBirth') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          cleaned[key] = value;
        }
        // Si la fecha es inválida, se omite (no se incluye en cleaned)
        continue;
      }
      
      // Incluir el valor si pasó las validaciones
      cleaned[key] = value;
    }
    
    return cleaned;
  }

  async create(createUserDto: CreateUserDto, roleEntities?: Role[]): Promise<User> {
    this.logger.warn('Comienza proceso creacion de usuario');
    
    try {
      // Separar configuraciones y datos principales
      const { notificationConfig, profileConfig, roleIds, ...userData } = createUserDto;

      // 🔥 BUSCAR LOS ROLES POR IDS
      let roles: Role[] = [];
      if (roleIds && roleIds.length > 0) {
        roles = await this.rolesRepository.find({
          where: { id: In(roleIds) }
        });
        
        if (roles.length !== roleIds.length) {
          throw new BadRequestException('Uno o más roles no existen');
        }
      }
      
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Mapear profileConfig del DTO al tipo de la entidad
      const mappedProfileConfig = profileConfig ? {
        bio: profileConfig.bio || undefined,
        phoneNumber: profileConfig.phoneNumber || undefined,
        type_document: profileConfig.type_document as DocumentType || DocumentType.CC,
        documentNumber: profileConfig.documentNumber || undefined,
        organization: profileConfig.organization || undefined,
        charge: profileConfig.charge || undefined,
        gender: profileConfig.gender || undefined,
        city: profileConfig.city || undefined,
        country: profileConfig.country || undefined,
        address: profileConfig.address || undefined,
        dateOfBirth: profileConfig.dateOfBirth ? new Date(profileConfig.dateOfBirth) : undefined,
      } : {
        bio: undefined,
        phoneNumber: undefined,
        type_document: DocumentType.OTHER,
        documentNumber: undefined,
        organization: undefined,
        charge: undefined,
        gender: undefined,
        city: undefined,
        country: undefined,
        address: undefined,
        dateOfBirth: undefined,
      };

      const mappedNotificationConfig = notificationConfig || {
        enableNotifications: true,
        smsNotifications: false,
        browserNotifications: false,
        securityAlerts: true,
        accountUpdates: false,
        systemUpdates: true,
        marketingEmails: false,
        newsletterEmails: false,
        reminders: true,
        mentions: true,
        directMessages: true,
      };

      // Preparar datos del usuario
      const userToCreate = {
        ...userData,
        password: userData.password,
        isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
        roles: roles,
        profileConfig: mappedProfileConfig,
        notificationConfig: mappedNotificationConfig,
      };
      
      this.logger.log('Datos del usuario a crear:', {
        email: userToCreate.email,
        name: userToCreate.name,
        lastName: userToCreate.lastName,
        tenantId: userToCreate.tenantId,
        rolesCount: userToCreate.roles.length,
        roleIds: userToCreate.roles.map(r => r.id)
      });
      
      // Crear y guardar usuario
      const user = this.usersRepository.create(userToCreate);
      const savedUsers = await this.usersRepository.save(user);
      const savedUser = Array.isArray(savedUsers) ? savedUsers[0] : savedUsers;
      
      this.logger.log(`Usuario creado exitosamente: ${savedUser.id}`);
      return savedUser;
      
    } catch (error) {
      this.logger.error('Error al crear usuario:', error);
      throw error;
    }
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

    // this.logger.warn(user);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string, tenantId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email, tenantId },
      select: ['id', 'email', 'lastName', 'password', 'name', 'isActive'],
      relations: ['tenant', 'roles', 'profileConfig', 'notificationConfig']
    });
  
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }
    return user;
  }

  async findByDocument(document: string, tenantId: string): Promise<User | null> {
    try {
      // Buscar usuario por documento en profileConfig
      // Nota: Esto asume que profileConfig tiene un campo documentNumber
      const user = await this.usersRepository.findOne({
        where: {
          tenantId,
          profileConfig: {
            documentNumber: document
          }
        },
        relations: ['roles', 'tenant']
      });

      return user;
    } catch (error) {
      console.error('Error al buscar usuario por documento:', error);
      return null;
    }
  }

  async findByEmailRegister(email: string, tenantId: string): Promise<User | null> {
    this.logger.log(`Buscando usuario por email: ${email} y tenantId: ${tenantId}`);
    try {
      const user = await this.usersRepository.findOne({
        where: { 
          email,
          tenantId 
        },
        select: ['id', 'email', 'name', 'tenantId'],
      });
    
      return user;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      return null;
    }
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

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }
} 
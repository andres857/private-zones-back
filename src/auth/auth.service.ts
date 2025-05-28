// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/token.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { LoginDto, RegisterDto, TokensResponseDto, RefreshTokenDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { TenantsService } from 'src/tenants/tenants.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesServices: RolesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    private readonly tenantsService: TenantsService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    this.logger.log(JSON.stringify(user));
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    this.logger.log('Validando contrasena para el usuario:', user.email);
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return user;
  }

  async login(req: Request): Promise<TokensResponseDto> {
    const user = await this.validateUser(req.body.email, req.body.password);
    return this.generateTokens(user, req);
  }

  async register(registerDto: RegisterDto, req: Request): Promise<{msg: string}> {
    // Revisar si usuario ya existe
    const existingUser = await this.usersService.findByEmailRegister(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Este usuario ya existe');
    }

    if(!registerDto.name || !registerDto.lastName) {
      throw new BadRequestException('El nombre y apellido son obligatorios');
    }else if (!registerDto.password) {
      throw new BadRequestException('La contraseña es obligatoria');
    }else if (!registerDto.tenantId) {
      throw new BadRequestException('El tenantId es obligatorio');
    }

    const tenantId = registerDto.tenantId; // tomar tenant del dto

    this.logger.log(`Registrando usuario para el tenant: ${tenantId}`);
  
    const roleName = registerDto.role; // Ya es de tipo UserRole por la validación
  
    if (!roleName) {
      throw new ConflictException('Ups, parece que no existen roles');
    }
  
    // Validación adicional si es necesario
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(roleName)) {
      throw new ConflictException(`El rol "${roleName}" no es válido. Roles válidos: ${validRoles.join(', ')}`);
    }
  
    // Buscar el rol en la base de datos
    const roleEntity = await this.rolesServices.findByName(roleName);
    if (!roleEntity) {
        throw new ConflictException(`El rol "${roleName}" no se encontró en la base de datos.`);
    }

    // Crear usuario sin incluir roles en el objeto
    const userData = {
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        lastName: registerDto.lastName,
        tenantId: tenantId,
    };

    // Pasar los role entities por separado
    const newUser = await this.usersService.create(userData, [roleEntity]);
  
    // return this.generateTokens(newUser, req);
    return {
      msg: 'Usuario creado correctamente',
    };
  }
  

  async refresh(refreshTokenDto: RefreshTokenDto, req: Request): Promise<TokensResponseDto> {
    try {
      // Validate the refresh token - this is handled by the JwtRefreshStrategy
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verificar que el token existe en la base de datos y no está revocado
      const isValid = await this.validateRefreshToken(refreshTokenDto.refreshToken, user.id);
      if (!isValid) {
        // The token is valid (signature, expiration) but not in our DB or is revoked
        // This could indicate token theft - revoke all tokens for this user
        await this.revokeAllUserTokens(user.id);
        throw new UnauthorizedException('Security alert: All sessions have been terminated');
      }

      // Revoke the old refresh token
      await this.revokeRefreshToken(refreshTokenDto.refreshToken);

      // Generate new tokens
      return this.generateTokens(user, req);
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  async logout(refreshToken: string, ipAddress?: string): Promise<boolean> {
    if (!refreshToken) {
      this.logger.warn('Intento de cierre de sesión sin refresh token');
      return true;
    }
    
    try {
      this.logger.log(`Intento de cierre de sesión para un token de actualización que termina en: ...${refreshToken.slice(-8)}`);
      
      // Verificar que el token existe y no está ya revocado
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken, isRevoked: false },
        relations: ['user']
      });

      if (!tokenRecord) {
        this.logger.warn(`Refresh token no encontrada o ya revocada: ...${refreshToken.slice(-8)}`);
        return true; // Token ya no válido, se considera logout exitoso
      }

      // Revocar el token
      await this.revokeRefreshToken(refreshToken, ipAddress);
      
      this.logger.log(`Usuario cerrado con éxito: ${tokenRecord.user.email}`);
      return true;
      
    } catch (error) {
      this.logger.error('Error al cerrar la sesión:', error);
      return false;
    }
  }

  async logoutFromAllDevices(userId: string, currentRefreshToken?: string): Promise<boolean> {
    try {
      this.logger.log(`Logging out user from all devices: ${userId}`);
      
      const updateData: Partial<RefreshToken> = {
        isRevoked: true,
        revokedAt: new Date(),
      };

      // Revocar todos los tokens del usuario excepto el actual (si se proporciona)
      const whereCondition: any = {
        userId,
        isRevoked: false,
      };

      if (currentRefreshToken) {
        whereCondition.token = Not(currentRefreshToken);
      }

      await this.refreshTokenRepository.update(whereCondition, updateData);
      
      return true;
    } catch (error) {
      this.logger.error('Error during logout from all devices:', error);
      return false;
    }
  }

  private async generateTokens(user: User, req: Request): Promise<TokensResponseDto> {
    // Extract role names from the Role objects
    const roleNames = user.roles.map(role => role.name);
    
    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: roleNames
    };
    
    // Valores de configuración con fallbacks
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION') || '1h';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    
    console.log('JWT Configuration:', {
      jwtExpiration,
      refreshExpiration
    });
    
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiration,
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    });
  
    // Store refresh token in database
    await this.storeRefreshToken(refreshToken, user.id, req);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames,
      },
    };
  }

  private async storeRefreshToken(token: string, userId: string, req: Request): Promise<void> {
    // Calculate expiration date
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';

    const expiresInMs = this.parseDuration(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);
    
    // Store token in the database
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    
    await this.refreshTokenRepository.save(refreshToken);
  }

  async validateRefreshToken(token: string, userId: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token, userId, isRevoked: false },
      relations: ['user'],
    });
    
    if (!refreshToken) {
      return false;
    }
    
    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      await this.revokeRefreshToken(token);
      return false;
    }
    
    return true;
  }

  private async revokeRefreshToken(token: string, ipAddress?: string): Promise<void> {
    const updateData: Partial<RefreshToken> = {
      isRevoked: true,
      revokedAt: new Date(), // Agregar timestamp de revocación
    };

    if (ipAddress) {
      updateData.revokedFromIp = ipAddress;
    }

    const result = await this.refreshTokenRepository.update(
      { token, isRevoked: false }, // Solo actualizar si no está ya revocado
      updateData
    );

    if (result.affected === 0) {
      throw new Error('Refresh token not found or already revoked');
    }
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600 * 1000; // Default to 1 hour if invalid format
    }
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000; // seconds
      case 'm': return value * 60 * 1000; // minutes
      case 'h': return value * 60 * 60 * 1000; // hours
      case 'd': return value * 24 * 60 * 60 * 1000; // days
      default: return 3600 * 1000; // default to 1 hour
    }
  }
}
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/token.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { LoginDto, RegisterDto, TokensResponseDto, RefreshTokenDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesServices: RolesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // if (!user.isActive) {
    //   throw new ForbiddenException('User account is inactive');
    // }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return user;
  }

  async login(loginDto: LoginDto, req: Request): Promise<TokensResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateTokens(user, req);
  }

  async register(registerDto: RegisterDto, req: Request): Promise<TokensResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmailRegister(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  
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
        tenantId: registerDto.tenantId,
    };

    // Pasar los role entities por separado
    const newUser = await this.usersService.create(userData, [roleEntity]);
  
    return this.generateTokens(newUser, req);
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

      // Verify the token exists in database and is not revoked
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

  async logout(refreshToken: string): Promise<boolean> {
    if (!refreshToken) {
      return true; // Nothing to do
    }
    
    try {
      await this.revokeRefreshToken(refreshToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  async logoutAll(userId: string): Promise<boolean> {
    await this.revokeAllUserTokens(userId);
    return true;
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

  private async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true }
    );
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
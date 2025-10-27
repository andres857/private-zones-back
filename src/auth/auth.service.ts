// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
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
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { plainToClass } from 'class-transformer';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesServices: RolesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly tenantsService: TenantsService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  async validateUser(
    identifier: string, 
    password: string, 
    tenantId: string,
    identifierType: 'email' | 'document' = 'email'
  ): Promise<any> {
    try {
      let user;

      // Buscar usuario según el tipo de identificador
      if (identifierType === 'email') {
        console.log('🔍 Buscando usuario por email:', identifier);
        user = await this.usersService.findByEmail(identifier, tenantId);
      } else {
        console.log('🔍 Buscando usuario por documento:', identifier);
        user = await this.usersService.findByDocument(identifier, tenantId);
      }

      console.log('📊 Usuario encontrado:', !!user);

      if (!user) {
        console.log('❌ Usuario no encontrado');
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if (!user.isActive) {
        console.log('❌ Usuario inactivo');
        throw new ForbiddenException('User account is inactive');
      }
      
      // Verificar que el password y la función comparePassword existen
      if (!user.comparePassword) {
        console.error('❌ Método comparePassword no existe en la entidad User');
        throw new Error('User entity missing comparePassword method');
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        console.log('❌ Contraseña inválida');
        throw new UnauthorizedException('Invalid credentials');
      }
      
      console.log('✅ Usuario validado exitosamente');
      return user;
      
    } catch (error) {
      console.error('💥 Error en validateUser:', error.message);
      console.error('📍 Stack trace:', error.stack);
      
      // Re-lanzar errores conocidos
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Para errores inesperados, lanzar error genérico
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(req: Request): Promise<TokensResponseDto> {
    try {
      const { email, document, password } = req.body;

      // Validación: debe venir email O document
      if (!email && !document) {
        throw new BadRequestException('Email o documento son requeridos');
      }

      if (!password) {
        throw new BadRequestException('La contraseña es requerida');
      }

      // El interceptor ya agregó la información del tenant
      const tenantId = req.body.tenantId || (req as any).tenant?.id;
      const tenant = (req as any).tenant;
      
      if (!tenantId) {
        throw new BadRequestException('No se pudo determinar el tenant');
      }

      // Obtener loginMethod del tenant
      const loginMethod = tenant?.config?.loginMethod || 'email';

      // Validar que el método de login sea correcto según configuración
      if (loginMethod === 'email' && !email) {
        throw new BadRequestException('Este tenant requiere login con email');
      }

      if (loginMethod === 'document' && !document) {
        throw new BadRequestException('Este tenant requiere login con documento');
      }

      // Validar usuario según el método configurado
      const identifier = email || document;
      const identifierType = email ? 'email' : 'document';
      
      const user = await this.validateUser(
        identifier, 
        password, 
        tenantId, 
        identifierType
      );
      
      console.log('✅ Usuario validado, generando tokens...');
      
      const tokens = await this.generateTokens(user, req);
      console.log('✅ Tokens generados exitosamente');
      
      return tokens;
      
    } catch (error) {
      console.error('💥 Error en login:', error.message);
      throw error;
    }
  }

  async register(registerDto: RegisterDto, req: Request): Promise<{msg: string}> {
    this.logger.log(`Logs register: ${JSON.stringify(registerDto)}`);

    try {
      // Obtener configuración del tenant
      const tenant = (req as any).tenant;
      const tenantConfig = tenant?.config || {};

      // Validar que el auto-registro esté permitido
      if (tenantConfig.allowSelfRegistration === false) {
        throw new ForbiddenException('El auto-registro no está permitido para este tenant');
      }

      // Validar campos requeridos según configuración del tenant
      this.validateRequiredFields(registerDto, tenantConfig);

      // Revisar si usuario ya existe
      const existingUser = await this.usersService.findByEmailRegister(
        registerDto.email, 
        registerDto.tenantId
      );
      
      if (existingUser) {
        throw new ConflictException('Este usuario ya existe');
      }

      this.logger.log(`Registrando usuario para el tenant: ${registerDto.tenantId}`);
    
      const roleName = registerDto.role;
    
      if (!roleName) {
        throw new ConflictException('El rol es requerido');
      }
    
      // Validación adicional del rol
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(roleName)) {
        throw new ConflictException(`El rol "${roleName}" no es válido. Roles válidos: ${validRoles.join(', ')}`);
      }
    
      // Buscar el rol en la base de datos
      const roleEntity = await this.rolesServices.findByName(roleName);
      if (!roleEntity) {
        throw new ConflictException(`El rol "${roleName}" no se encontró en la base de datos.`);
      }

      // Crear userData que coincida con CreateUserDto
      const userData: CreateUserDto = {
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        lastName: registerDto.lastName || '',
        tenantId: registerDto.tenantId,
        isActive: true,

        profileConfig: {
          type_document: registerDto.documentType,
          documentNumber: registerDto.document,
          organization: registerDto.organization,
          phoneNumber: registerDto.phone,
          charge: registerDto.position,
          gender: registerDto.gender,
          city: registerDto.city,
          address: registerDto.address,
        },
        // Configuración de notificaciones por defecto para nuevos usuarios
        notificationConfig: {
          enableNotifications: true,     // Activar notificaciones generales
          smsNotifications: false,       // SMS desactivado por defecto
          browserNotifications: true,    // Notificaciones del navegador activadas
          securityAlerts: true,          // Alertas de seguridad siempre activadas
          accountUpdates: true,          // Actualizaciones de cuenta activadas
          systemUpdates: false,          // Actualizaciones del sistema desactivadas
          marketingEmails: false,        // Marketing desactivado por defecto
          newsletterEmails: false,       // Newsletter desactivado por defecto
          reminders: true,               // Recordatorios activados
          mentions: true,                // Menciones activadas
          directMessages: true           // Mensajes directos activados
        }
      };

      // Crear usuario con role entity
      const newUser = await this.usersService.create(userData, [roleEntity]);
      
      this.logger.log(`Usuario creado exitosamente: ${newUser.id}`);
    
      return {
        msg: 'Usuario creado correctamente',
      };
      
    } catch (error) {
      this.logger.error('Error en registro de usuario:', error);
      throw error;
    }
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

  async debugJWTConfiguration() {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    
    console.log('🔍 COMPLETE JWT DEBUG:', {
      jwtSecret: jwtSecret ? `${jwtSecret.substring(0, 10)}...` : 'NOT_SET',
      jwtSecretLength: jwtSecret?.length || 0,
      jwtExpiration,
      jwtExpirationType: typeof jwtExpiration,
      refreshSecret: refreshSecret ? `${refreshSecret.substring(0, 10)}...` : 'NOT_SET',
      refreshExpiration,
      environmentVariables: {
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || 'NOT_SET',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT_SET',
        JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || 'NOT_SET'
      }
    });
  }

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'config', 'profileConfig'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Retorna solo las propiedades necesarias
    return plainToClass(UserProfileResponseDto, user, { 
      excludeExtraneousValues: true 
    });
  }

  private async generateTokens(user: User, req: Request): Promise<TokensResponseDto> {
    const roleNames = user.roles.map(role => role.name);
    
    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: roleNames
    };
    
    // 🔍 Debug configuration first
    // await this.debugJWTConfiguration();
    
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    
    // ✅ CRITICAL FIX: Use JwtService without overriding configuration
    // This will use the configuration from AuthModule (secret + expiration)
    console.log('🔧 Generating access token using AuthModule configuration...');
    const accessToken = this.jwtService.sign(payload);
    
    console.log('🔧 Generating refresh token with custom configuration...');
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    });

    // 🔍 Verify the generated access token
    try {
      const decoded = this.jwtService.verify(accessToken);
      const now = Math.floor(Date.now() / 1000);
      const duration = decoded.exp - decoded.iat;
      
      // console.log('✅ Access token verification:', {
      //   iat: new Date(decoded.iat * 1000).toISOString(),
      //   exp: new Date(decoded.exp * 1000).toISOString(),
      //   duration: `${duration} seconds`,
      //   durationInHours: `${(duration / 3600).toFixed(2)} hours`,
      //   durationInMinutes: `${(duration / 60).toFixed(1)} minutes`,
      //   isValid: decoded.exp > now,
      //   timeUntilExpiry: `${decoded.exp - now} seconds`
      // });
      
      // 🚨 Alert if duration is still wrong
      if (duration < 60) {
        console.error('🚨 WARNING: Token duration is less than 1 minute!');
        console.error('🚨 This indicates AuthModule configuration is wrong');
      }
      
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      throw new Error('Failed to generate valid access token');
    }

    await this.storeRefreshToken(refreshToken, user.id, req);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        isActive: user.isActive,
        roles: roleNames,
        profileConfig: user.profileConfig,
        notificationConfig: user.notificationConfig,
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

  private validateRequiredFields(registerDto: RegisterDto, tenantConfig: any): void {
    const errors: string[] = [];

    // Nombre y email siempre son requeridos
    if (!registerDto.name) {
      errors.push('El nombre es requerido');
    }
    if (!registerDto.email) {
      errors.push('El email es requerido');
    }

    // Validar campos según configuración
    if (tenantConfig.requireLastName && !registerDto.lastName) {
      errors.push('El apellido es requerido');
    }

    if (tenantConfig.requirePhone && !registerDto.phone) {
      errors.push('El teléfono es requerido');
    }

    if (tenantConfig.requireDocument && !registerDto.document) {
      errors.push('El documento es requerido');
    }

    if (tenantConfig.requireDocumentType && !registerDto.documentType) {
      errors.push('El tipo de documento es requerido');
    }

    if (tenantConfig.requireOrganization && !registerDto.organization) {
      errors.push('La organización es requerida');
    }

    if (tenantConfig.requirePosition && !registerDto.position) {
      errors.push('El cargo es requerido');
    }

    if (tenantConfig.requireGender && !registerDto.gender) {
      errors.push('El género es requerido');
    }

    if (tenantConfig.requireCity && !registerDto.city) {
      errors.push('La ciudad es requerida');
    }

    if (tenantConfig.requireAddress && !registerDto.address) {
      errors.push('La dirección es requerida');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(', '));
    }
  }
}
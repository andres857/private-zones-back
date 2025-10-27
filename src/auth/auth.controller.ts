// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, TokensResponseDto, LogoutDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';
import { GetUser } from './decorators/get-user.decorator';
// import { User } from './entities/user.entity';
import { DefaultRoleInterceptor } from './interceptors/default-role.interceptor';
import { UserRole } from 'src/common/enums/user-role.enum';
import { TenantValidationInterceptor } from './interceptors/tenant-validation.interceptor';
import { User } from 'src/users/entities/user.entity';

import { JwtDebugUtil } from './utils/jwt-debug.util';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly jwtDebugUtil: JwtDebugUtil,) {}

  // @Post('debug-token')
  // @Public() // Make this public for testing
  // debugToken(@Body('token') token: string) {
  //   return this.jwtDebugUtil.analyzeToken(token);
  // }

  // Profile User
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('profile')
  async getUserProfile(@GetUser() user: User): Promise<UserProfileResponseDto> {
    try {
      return this.authService.getUserProfile(user.id);
    } catch (error) {
      throw error;
    }
  }

  @UseInterceptors(
    TenantValidationInterceptor // Interceptor de tenant
  )
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Body() loginDto: LoginDto): Promise<TokensResponseDto> {
    console.log('AuthController - login called with body:', req.body);
    return this.authService.login(req);
  }

  @Public()
  @UseInterceptors(
    new DefaultRoleInterceptor(UserRole.USER),
    TenantValidationInterceptor // Interceptor de tenant
  )
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<{msg: string}> {
    return this.authService.register(registerDto, req);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request): Promise<TokensResponseDto> {
    return this.authService.refresh(refreshTokenDto, req);
  }

  @UseInterceptors(
    TenantValidationInterceptor // Interceptor de tenant
  )
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() logoutDto: LogoutDto,
    @Req() request: Request
  ): Promise<{ success: boolean; message: string }> {
    const { refreshToken } = logoutDto;
    const ipAddress = this.getClientIp(request);
    
    const success = await this.authService.logout(refreshToken, ipAddress);
    
    return {
      success,
      message: success ? 'Cierre de sesión con éxito' : 'Error de cierre de sesión'
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) // Requiere estar autenticado
  async logoutFromAllDevices(
    @Body() body: { currentRefreshToken?: string },
    @Req() request: any
  ): Promise<{ success: boolean; message: string }> {
    const userId = request.user.id;
    const { currentRefreshToken } = body;
    
    const success = await this.authService.logoutFromAllDevices(userId, currentRefreshToken);
    
    return {
      success,
      message: success 
        ? 'Successfully logged out from all devices' 
        : 'Failed to logout from all devices'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: User) {
    // Validación defensiva
    const roleNames = user.roles?.map(role => role.name) || [];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleNames,
    };
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
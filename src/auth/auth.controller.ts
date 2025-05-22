// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, TokensResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { DefaultRoleInterceptor } from './interceptors/default-role.interceptor';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<TokensResponseDto> {
    return this.authService.login(loginDto, req);
  }

  @Public()
  @UseInterceptors(new DefaultRoleInterceptor(UserRole.USER))
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<TokensResponseDto> {
    return this.authService.register(registerDto, req);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request): Promise<TokensResponseDto> {
    return this.authService.refresh(refreshTokenDto, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() { refreshToken }: RefreshTokenDto): Promise<{ success: boolean }> {
    const success = await this.authService.logout(refreshToken);
    return { success };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@GetUser() user: User): Promise<{ success: boolean }> {
    const success = await this.authService.logoutAll(user.id);
    return { success };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: User) {

    const roleNames = user.roles.map(role => role.name);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleNames,
    };
  }
}
// src/auth/strategies/jwt-refresh.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET not defined');
    }

    super({
        jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
        ignoreExpiration: false,
        secretOrKey: refreshSecret,
        passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken;
    const isValid = await this.authService.validateRefreshToken(refreshToken, payload.sub);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    const user = await this.usersService.findOne(payload.sub);

    const roleNames = user.roles.map(role => role.name);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleNames,
    };
  }
}
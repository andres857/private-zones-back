// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET') || (() => { throw new Error('JWT_SECRET not defined'); })(),
    });
  }

  async validate(payload: any) {
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
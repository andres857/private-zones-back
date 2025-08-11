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
    const secret = configService.get<string>('JWT_SECRET');
    
    // Debug: Log the secret (remove in production!)
    // console.log('JWT_SECRET configured:', secret ? 'YES' : 'NO');
    // console.log('JWT_SECRET length:', secret?.length || 0);
    
    if (!secret) {
      throw new Error('JWT_SECRET not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // console.log('=== JWT Strategy Validate Called ===');
    // console.log('Payload received:', payload);
    // console.log('User ID (sub):', payload.sub);
    // console.log('Token expiration:', new Date(payload.exp * 1000));
    // console.log('Current time:', new Date());
    
    try {
      // Check if user exists
      const user = await this.usersService.findOne(payload.sub);
      // console.log('User found:', user ? 'YES' : 'NO');
      
      if (!user) {
        console.log('ERROR: User not found in database');
        throw new UnauthorizedException('User not found');
      }

      // console.log('User isActive:', user.isActive);
      // console.log('User roles:', user.roles?.map(role => role.name));
      
      if (!user.isActive) {
        console.log('ERROR: User is inactive');
        throw new UnauthorizedException('User account is inactive');
      }

      const roleNames = user.roles?.map(role => role.name) || [];
      
      const validatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleNames,
      };

      // console.log('Validated user object:', validatedUser);
      // console.log('=== JWT Strategy Validate Success ===');
      
      return validatedUser;
      
    } catch (error) {
      console.log('=== JWT Strategy Validate Error ===');
      console.log('Error:', error.message);
      throw error;
    }
  }
}
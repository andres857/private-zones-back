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
    
    // Enhanced debug logging for the token expiration issue
    // console.log('🔧 JWT Strategy Configuration:', {
    //   hasSecret: !!secret,
    //   secretLength: secret?.length || 0,
    //   secretPreview: secret ? `${secret.substring(0, 10)}...` : 'NOT_SET'
    // });
    
    if (!secret) {
      throw new Error('JWT_SECRET not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // ✅ This is correct - tokens should expire
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // console.log('🔍 JWT Strategy Validate Called');
    
    // ✅ Enhanced token expiration debugging
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = payload.exp - now;
    const isExpired = payload.exp < now;
    
    // console.log('🔍 Token Analysis:', {
    //   userID: payload.sub,
    //   email: payload.email,
    //   issuedAt: new Date(payload.iat * 1000).toISOString(),
    //   expiresAt: new Date(payload.exp * 1000).toISOString(),
    //   currentTime: new Date().toISOString(),
    //   timeToExpirySeconds: timeToExpiry,
    //   timeToExpiryMinutes: Math.round(timeToExpiry / 60),
    //   isExpired,
    //   tokenAgeSeconds: now - payload.iat
    // });
    
    // ✅ If token is expired, this will be handled by Passport automatically
    // but let's log it for debugging
    if (isExpired) {
      console.log('❌ Token is expired!');
      // Passport will handle this automatically, but we log for debug
    }
    
    try {
      // Check if user exists
      const user = await this.usersService.findOne(payload.sub);
      // console.log('🔍 User lookup result:', user ? 'FOUND' : 'NOT_FOUND');
      
      if (!user) {
        console.log('❌ User not found in database');
        throw new UnauthorizedException('User not found');
      }

      // console.log('🔍 User status:', {
      //   isActive: user.isActive,
      //   roleCount: user.roles?.length || 0,
      //   roles: user.roles?.map(role => role.name) || []
      // });
      
      if (!user.isActive) {
        console.log('❌ User account is inactive');
        throw new UnauthorizedException('User account is inactive');
      }

      const roleNames = user.roles?.map(role => role.name) || [];
      
      const validatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleNames, // ✅ Keeping your existing format
      };

      // console.log('✅ JWT validation successful for user:', user.email);
      
      return validatedUser;
      
    } catch (error) {
      console.log('❌ JWT Strategy validation error:', error.message);
      throw error;
    }
  }
}
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';
import { User } from './entities/user.entity';
import { RolesModule } from '../roles/roles.module';
import { RefreshToken } from './entities/token.entity';
import { TenantsModule } from 'src/tenants/tenants.module';
import { JwtDebugUtil } from './utils/jwt-debug.util';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // ✅ FIXED: Get proper JWT configuration
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRATION', '1h');
        
        // 🔍 Debug logging to track the issue
        // console.log('🔧 AuthModule JWT Configuration:', {
        //   hasSecret: !!secret,
        //   secretLength: secret?.length || 0,
        //   expiresIn,
        //   expiresInType: typeof expiresIn
        // });
        
        // ✅ CRITICAL: Validate that JWT_SECRET exists
        if (!secret) {
          throw new Error('❌ JWT_SECRET is required but not found in environment variables');
        }
        
        // ✅ CRITICAL: Validate secret length for security
        if (secret.length < 32) {
          throw new Error('❌ JWT_SECRET must be at least 32 characters long for security');
        }
        
        return {
          secret, // ✅ FIXED: No default value - must be provided in env
          signOptions: {
            expiresIn, // ✅ FIXED: Use string format (e.g., '1h', '3600s')
          },
        };
      },
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
    UsersModule,
    RolesModule,
    TenantsModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtDebugUtil],
  exports: [AuthService],
})
export class AuthModule {}
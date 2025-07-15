import { IsEmpty, IsNotEmpty, IsString, MinLength, IsEmail, IsEnum, IsUUID, IsOptional } from "class-validator";
import { UserRole } from "src/common/enums/user-role.enum";

// src/auth/dto/auth.dto.ts
export class LoginDto {
    email: string;
    password: string;
}
  
export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;
  
    @IsNotEmpty()
    @IsString()
    lastName: string;
  
    @IsNotEmpty()
    @IsEmail()
    email: string;
  
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;
  
    @IsNotEmpty()
    // @IsUUID()
    tenantId: string;
  
    @IsNotEmpty()
    @IsEnum(UserRole, { message: 'Invalid role' })
    role: UserRole; // Un solo rol para el registro
}
  
export class TokensResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      lastName: string;
      isActive: boolean;
      roles: string[];
      profileConfig?: any;
      notificationConfig?: any;
    };
}
  
export class RefreshTokenDto {
    refreshToken: string;
}

export class LogoutDto {
  @IsString()
  refreshToken: string;
  
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  tenantDomain?: string;
}

export class LogoutAllDto {
  @IsOptional()
  @IsString()
  currentRefreshToken?: string;
}

export class LogoutResponseDto {
  success: boolean;
  message: string;
}

export class ActiveSessionDto {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  lastUsed: Date;
  isCurrent: boolean;
}
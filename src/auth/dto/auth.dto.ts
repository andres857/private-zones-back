import { IsEmpty, IsNotEmpty, IsString, MinLength, IsEmail, IsEnum, IsUUID, IsOptional, isEnum } from "class-validator";
import { UserRole } from "src/common/enums/user-role.enum";
import { DocumentType } from "src/users/entities/user-profile-config.entity";

// src/auth/dto/auth.dto.ts
export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  tenantId?: string;
}
  
export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;
  
    @IsOptional()
    @IsString()
    lastName?: string;
  
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

    @IsOptional()
    @IsString()
    document: string; // Número de identificación o documento

    @IsOptional()
    @IsString()
    organization: string;

    @IsOptional()
    @IsString()
    position: string; // Cargo o puesto en la organización

    @IsOptional()
    @IsString()
    gender: string;

    @IsOptional()
    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    phone: string;

    @IsOptional()
    @IsString({ message: 'type_document debe ser string' })
    @IsEnum(DocumentType, {
      message: 'Tipo de documento debe ser un valor válido'
    })
    type_document?: DocumentType;
  
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
  @IsString()
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
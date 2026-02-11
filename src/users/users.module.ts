import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RefreshToken } from 'src/auth/entities/token.entity';
import { UserNotificationConfig } from './entities/user-notification-config.entity';
import { UserProfileConfig } from './entities/user-profile-config.entity';
import { UserConfig } from './entities/user-config.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserConfig, UserProfileConfig, UserNotificationConfig, Tenant]), TenantsModule],
  controllers: [UsersController],
  providers: [UsersService, TenantValidationInterceptor],
  exports: [UsersService],
})
export class UsersModule {}
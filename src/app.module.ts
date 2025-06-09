import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { RolesModule } from './roles/roles.module';
import { SendMailsModule } from './send-mails/send-mails.module';
import { CoursesModule } from './courses/courses.module';
import { EventsGateway } from './events/events.gateway'; 



import { User } from './users/entities/user.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantConfig } from './tenants/entities/tenant-config.entity';
import { TenantContactInfo } from './tenants/entities/tenant-contact-info.entity';
import { Role } from './roles/entities/role.entity';
import { GatewayPaymentModule } from './gateway-payment/gateway-payment.module';
import { AuthModule } from './auth/auth.module';
import { RefreshToken } from './auth/entities/token.entity';
import { Course } from './courses/entities/course.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      database: process.env.DATABASE_NAME || 'net_db',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      entities: [User, Tenant, TenantConfig, TenantContactInfo, Role, RefreshToken, Course],
      synchronize: true,
    }),
    UsersModule,
    TenantsModule,
    RolesModule,
    SendMailsModule,
    GatewayPaymentModule,
    AuthModule,
    CoursesModule
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
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
import { AuthModule } from './auth/auth.module';
import { GatewayPaymentModule } from './gateway-payment/gateway-payment.module';
import { PrivateZonesModule } from './private-zones/private-zones.module'

import { EventsGateway } from './events/events.gateway'; 

import { User } from './users/entities/user.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantConfig } from './tenants/entities/tenant-config.entity';
import { TenantContactInfo } from './tenants/entities/tenant-contact-info.entity';
import { Role } from './roles/entities/role.entity';
import { RefreshToken } from './auth/entities/token.entity';
import { Course } from './private-zones/entities/course.entity';
import { TenantProduct } from './tenants/entities/tenant-product.entity';
import { Subscription } from './tenants/entities/suscription-tenant.entity';
import { TenantViewConfig } from './tenants/entities/tenant-view-config.entity';
import { TenantComponentConfig } from './tenants/entities/tenant-component-config.entity';
import { UserConfig } from './users/entities/user-config.entity';
import { UserProfileConfig } from './users/entities/user-profile-config.entity';
import { UserNotificationConfig } from './users/entities/user-notification-config.entity';
import { SectionsModule } from './sections/sections.module';
import { Section } from './sections/entities/sections.entity';
import { Courses } from './courses/entities/courses.entity';
import { CourseConfiguration } from './courses/entities/courses-config.entity';
import { CourseTranslation } from './courses/entities/courses-translations.entity';
import { CoursesViewsConfig } from './courses/entities/courses-view-config.entity';


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
      entities: [User, Tenant, TenantConfig, TenantContactInfo, Role, RefreshToken, TenantProduct, TenantViewConfig, TenantComponentConfig, Subscription, UserConfig, UserProfileConfig, UserNotificationConfig, Section, Courses, CourseConfiguration, CourseTranslation, CoursesViewsConfig],
      synchronize: true,
    }),
    UsersModule,
    TenantsModule,
    RolesModule,
    SendMailsModule,
    GatewayPaymentModule,
    AuthModule,
    CoursesModule,
    PrivateZonesModule,
    SectionsModule
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
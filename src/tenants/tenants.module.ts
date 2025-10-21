import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { Tenant } from './entities/tenant.entity';
import { TenantProduct } from './entities/tenant-product.entity';
import { Subscription } from './entities/suscription-tenant.entity';
import { LaravelWebhookService } from './laravel-webhook.service';
import { User } from 'src/users/entities/user.entity';
import { TenantConfig } from './entities/tenant-config.entity';
import { TenantContactInfo } from './entities/tenant-contact-info.entity';
import { TenantComponentConfig } from './entities/tenant-component-config.entity';
import { TenantViewConfig } from './entities/tenant-view-config.entity';
import { Role } from 'src/roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantProduct, TenantConfig, TenantContactInfo, TenantViewConfig, Subscription, User, TenantComponentConfig, Role]),
    HttpModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, LaravelWebhookService],
  exports: [TenantsService, LaravelWebhookService],
})
export class TenantsModule {}

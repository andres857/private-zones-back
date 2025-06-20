import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { Tenant } from './entities/tenant.entity';
import { TenantProduct } from './entities/tenant-product.entity';
import { Subscription } from './entities/suscription-tenant.entity';
import { LaravelWebhookService } from './laravel-webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantProduct, Subscription]),
    HttpModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, LaravelWebhookService],
  exports: [TenantsService, LaravelWebhookService],
})
export class TenantsModule {}

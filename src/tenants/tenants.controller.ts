import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, NotFoundException, Query, ForbiddenException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}


  @Get('/validate-domain')
  @HttpCode(HttpStatus.OK)
  async validateByDomain(@Query('domain') domain: string) {
    if (!domain) {
      throw new NotFoundException('Domain parameter is required');
    }

    try {
      const tenant = await this.tenantsService.findByDomain(domain);
      
      if (!tenant) {
        return {
          tenant: null,
          isValid: false,
          isActive: false,
          error: 'TENANT_NOT_FOUND',
          message: 'No tenant found for this domain'
        };
      }

      // Verificar si el tenant está activo
      const isActive = await this.tenantsService.isTenantActive(tenant.id);
      
      if (!isActive) {
        return {
          tenant: null,
          isValid: false,
          isActive: false,
          error: 'TENANT_INACTIVE',
          message: 'Tenant is not active'
        };
      }

      return {
        tenant,
        isValid: true,
        isActive: true,
        message: 'Tenant is valid and active'
      };
    } catch (error) {
      throw new NotFoundException('Error validating tenant');
    }
  }

  // Endpoint para verificar estado rápido (HEAD request)
  @Get('/check-status')
  @HttpCode(HttpStatus.OK)
  async checkTenantStatus(@Query('domain') domain: string) {
    if (!domain) {
      throw new NotFoundException('Domain parameter is required');
    }

    const tenant = await this.tenantsService.findByDomain(domain);
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const isActive = await this.tenantsService.isTenantActive(tenant.id);
    
    if (!isActive) {
      throw new ForbiddenException('Tenant is not active');
    }

    return { status: 'active', tenantId: tenant.id };
  }

  // Endpoint para obtener tenant por dominio
  @Get('/by-domain/:domain')
  async findByDomain(@Param('domain') domain: string) {
    const tenant = await this.tenantsService.findByDomain(domain);
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found for this domain');
    }

    return tenant;
  }

  // Endpoint para obtener configuración del tenant
  @Get(':id/config')
  async getTenantConfig(@Param('id') id: string) {
    return this.tenantsService.getTenantWithConfig(id);
  }

  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
} 
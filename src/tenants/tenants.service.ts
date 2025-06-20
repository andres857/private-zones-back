import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantProduct } from './entities/tenant-product.entity';
import { CreateTenantProductDto } from './dto/create-tenant-product.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantProduct)
    private tenantProductRepository: Repository<TenantProduct>,
  ) { }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const { slug, domain } = dto;

    // Validar que no exista otro con el mismo slug o dominio
    const existing = await this.tenantRepository.findOne({
      where: [{ slug }, { domain }],
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un tenant con el slug o dominio "${slug}" / "${domain}"`,
      );
    }

    const tenant = this.tenantRepository.create(dto);
    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return await this.tenantRepository.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${id} no encontrado`);
    }
    return tenant;
  }

  async findByClientIdMz(clientIdMz: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ 
      where: { client_id_mz: clientIdMz },
      relations: ['products']
    });
  }

  async createTenantFromClient(createTenantProductDto: CreateTenantProductDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      client_id_mz: createTenantProductDto.client_id_mz,
      name: createTenantProductDto.tenant_name || `Client ${createTenantProductDto.client_id_mz}`,
      slug: createTenantProductDto.tenant_slug || `client-${createTenantProductDto.client_id_mz}`,
      domain: createTenantProductDto.tenant_domain || `client-${createTenantProductDto.client_id_mz}.app.com`,
      contactEmail: createTenantProductDto.tenant_contact_email,
      plan: 'free'
    });

    return this.tenantRepository.save(tenant);
  }

  async createTenantProduct(tenantId: string, createTenantProductDto: CreateTenantProductDto): Promise<TenantProduct> {
    // Verificar si ya existe un producto con el mismo laravel_plan_id para este tenant
    const existingProduct = await this.tenantProductRepository.findOne({
      where: {
        tenant_id: tenantId,
        laravel_plan_id: createTenantProductDto.laravel_plan_id
      }
    });

    if (existingProduct) {
      // Actualizar producto existente
      Object.assign(existingProduct, {
        title: createTenantProductDto.title,
        description: createTenantProductDto.description,
        price: createTenantProductDto.price,
        currency: createTenantProductDto.currency,
        type_payment: createTenantProductDto.type_payment,
        recurring: createTenantProductDto.recurring,
        features: createTenantProductDto.features,
        max_users: createTenantProductDto.max_users,
        max_storage_gb: createTenantProductDto.max_storage_gb,
        modules_access: createTenantProductDto.modules_access,
        is_active: createTenantProductDto.is_active ?? true,
        is_popular: createTenantProductDto.is_popular ?? false,
        is_featured: createTenantProductDto.is_featured ?? false,
        trial_period_days: createTenantProductDto.trial_period_days,
        setup_fee: createTenantProductDto.setup_fee,
        status: 'active'
      });

      return this.tenantProductRepository.save(existingProduct);
    }

    // Crear nuevo producto
    const tenantProduct = this.tenantProductRepository.create({
      tenant_id: tenantId,
      laravel_plan_id: createTenantProductDto.laravel_plan_id,
      title: createTenantProductDto.title,
      description: createTenantProductDto.description,
      price: createTenantProductDto.price,
      currency: createTenantProductDto.currency,
      type_payment: createTenantProductDto.type_payment,
      recurring: createTenantProductDto.recurring,
      features: createTenantProductDto.features,
      max_users: createTenantProductDto.max_users,
      max_storage_gb: createTenantProductDto.max_storage_gb,
      modules_access: createTenantProductDto.modules_access,
      is_active: createTenantProductDto.is_active ?? true,
      is_popular: createTenantProductDto.is_popular ?? false,
      is_featured: createTenantProductDto.is_featured ?? false,
      trial_period_days: createTenantProductDto.trial_period_days,
      setup_fee: createTenantProductDto.setup_fee,
      status: 'active'
    });

    const savedProduct = await this.tenantProductRepository.save(tenantProduct);

    // Aquí puedes agregar la lógica para crear el producto en Stripe
    // await this.createStripeProduct(savedProduct);

    return savedProduct;
  }

  // Método para crear producto en Stripe (implementar según necesidades)
  private async createStripeProduct(tenantProduct: TenantProduct): Promise<void> {
    // TODO: Implementar integración con Stripe
    // const stripeProduct = await stripe.products.create({...});
    // const stripePrice = await stripe.prices.create({...});
    // 
    // tenantProduct.stripe_product_id = stripeProduct.id;
    // tenantProduct.stripe_price_id = stripePrice.id;
    // 
    // await this.tenantProductRepository.save(tenantProduct);
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return await this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<DeleteResult> {
    return await this.tenantRepository.delete(id);
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    console.log('Finding tenant by domain:', domain);
    const tenant = await this.tenantRepository.findOne({
      where: { domain: domain },
      relations: ['config', 'contactInfo']
    });
    console.log('Found tenant:', tenant);
    if (!tenant) {  
      console.log('No tenant found for domain:', domain);
      return null;
    }
    
    return tenant;
  }

  // Método para verificar si un tenant está activo
  async isTenantActive(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    if (!tenant) {
      return false;
    }

    // Aquí puedes agregar lógica adicional para verificar:
    // - Si la suscripción está activa
    // - Si el tenant no está suspendido
    // - Si el plan no ha expirado
    // - Etc.

    // Por ahora, verificamos si el tenant existe y tiene un plan
    return tenant.plan !== null && tenant.plan !== 'suspended';
  }

  // Método para obtener tenant con configuración completa
  async getTenantWithConfig(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['config', 'contactInfo']
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  // Método para verificar dominio y subdominio
  async findByDomainOrSubdomain(domain: string): Promise<Tenant | null> {
    // Buscar coincidencia exacta primero
    let tenant = await this.tenantRepository.findOne({
      where: { domain },
      relations: ['config', 'contactInfo']
    });

    if (tenant) {
      return tenant;
    }

    // Si no hay coincidencia exacta, buscar por slug en subdominios
    // Por ejemplo: cardio.klmsystem.test -> buscar slug "cardio"
    const parts = domain.split('.');
    if (parts.length > 1) {
      const possibleSlug = parts[0];
      tenant = await this.tenantRepository.findOne({
        where: { slug: possibleSlug },
        relations: ['config', 'contactInfo']
      });
    }

    return tenant;
  }

  // Método para validar dominio completo
  async validateDomain(domain: string): Promise<{
    tenant: Tenant | null;
    isValid: boolean;
    isActive: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      const tenant = await this.findByDomainOrSubdomain(domain);

      if (!tenant) {
        return {
          tenant: null,
          isValid: false,
          isActive: false,
          error: 'TENANT_NOT_FOUND',
          message: 'No tenant found for this domain'
        };
      }

      const isActive = await this.isTenantActive(tenant.id);

      if (!isActive) {
        return {
          tenant,
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
      return {
        tenant: null,
        isValid: false,
        isActive: false,
        error: 'VALIDATION_ERROR',
        message: 'Error validating tenant'
      };
    }
  }

  async setTenantStatus(id: string, isActive: boolean): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Cambiar el plan para reflejar el estado
    const plan = isActive ? (tenant.plan === 'suspended' ? 'free' : tenant.plan) : 'suspended';

    await this.tenantRepository.update(id, { plan });
    return this.findOne(id);
  }
} 
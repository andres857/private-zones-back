import { Injectable, Inject, ConflictException, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, SelectQueryBuilder, DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantProduct } from './entities/tenant-product.entity';
import { CreateTenantProductDto } from './dto/create-tenant-product.dto';
import { Subscription } from './entities/suscription-tenant.entity';
import { LaravelWebhookService } from './laravel-webhook.service';
import { CreateSubscriptionDto } from './dto/suscription-tenant-user.dto';
import { PaginatedTenantsResponseDto, TenantQueryDto } from './dto/tenant-query.dto';
import { User } from 'src/users/entities/user.entity';
import { TenantConfig } from './entities/tenant-config.entity';
import { TenantContactInfo } from './entities/tenant-contact-info.entity';
import { TenantViewConfig, ViewType } from './entities/tenant-view-config.entity';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @Inject('STRIPE_API') private readonly stripe: Stripe,
    private configService: ConfigService,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantProduct)
    private tenantProductRepository: Repository<TenantProduct>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(TenantConfig)
    private readonly tenantConfigRepository: Repository<TenantConfig>,
    
    @InjectRepository(TenantContactInfo)
    private readonly tenantContactInfoRepository: Repository<TenantContactInfo>,

    @InjectRepository(TenantViewConfig)
    private readonly tenantViewConfigRepository: Repository<TenantViewConfig>,
    
    private readonly dataSource: DataSource,

    private laravelWebhookService: LaravelWebhookService,
  ) { }


  async getTenantIdByDomain(domain: string): Promise<string | null> {
    const tenant = await this.tenantRepository.findOne({
      where: { domain },
      select: ['id'],
    });

    return tenant?.id ?? null;
  }

  async toggleActive(tenantId: string): Promise<{ status: boolean; message: string }> {
    try {
      // Buscar el tenant con su configuración
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        relations: ['config']
      });

      if (!tenant) {
        throw new NotFoundException({
          error: 'TENANT_NOT_FOUND',
          message: `El tenant con ID ${tenantId} no fue encontrado`,
        });
      }

      // Si no tiene configuración, crearla
      if (!tenant.config) {
        const newConfig = this.tenantConfigRepository.create({
          tenant: tenant,
          status: false // Lo creamos como inactivo y luego lo activamos
        });
        tenant.config = await this.tenantConfigRepository.save(newConfig);
      }

      // Toggle del status
      const currentStatus = tenant.config.status;
      const newStatus = !currentStatus;
      
      // Actualizar el status
      await this.tenantConfigRepository.update(tenant.config.id, {
        status: newStatus
      });

      console.log(`Tenant ${tenantId} status changed from ${currentStatus} to ${newStatus}`);

      return {
        status: newStatus,
        message: newStatus ? 'Tenant activado exitosamente' : 'Tenant desactivado exitosamente'
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error toggling tenant status:', error);
      throw new BadRequestException({
        error: 'TOGGLE_ERROR',
        message: 'Error al cambiar el estado del tenant',
        details: error.message
      });
    }
  }

  async getStatus(tenantId: string): Promise<{ status: boolean }> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        relations: ['config']
      });

      if (!tenant) {
        throw new NotFoundException({
          error: 'TENANT_NOT_FOUND',
          message: `El tenant con ID ${tenantId} no fue encontrado`,
        });
      }

      // Si no tiene configuración, asumir que está activo por defecto
      const status = tenant.config?.status ?? true;

      return { status };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException({
        error: 'GET_STATUS_ERROR',
        message: 'Error al obtener el estado del tenant',
        details: error.message
      });
    }
  }

  // Método helper para verificar si un tenant está activo
  async isActive(tenantId: string): Promise<boolean> {
    const statusResult = await this.getStatus(tenantId);
    return statusResult.status;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const { slug, domain, name } = dto;

    console.log("=== BACKEND CREATE TENANT DEBUG ===");
    console.log("Received DTO:", JSON.stringify(dto, null, 2));

    // Usar transaction para asegurar que tanto el tenant como su config se creen correctamente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validaciones de negocio adicionales
      await this.validateTenantData(dto);

      // Verificar duplicados más específicamente
      const existingBySlug = await this.tenantRepository.findOne({ where: { slug } });
      const existingByDomain = await this.tenantRepository.findOne({ where: { domain } });

      console.log("Existing by slug:", existingBySlug ? "FOUND" : "NOT_FOUND");
      console.log("Existing by domain:", existingByDomain ? "FOUND" : "NOT_FOUND");

      if (existingBySlug) {
        throw new ConflictException({
          error: 'SLUG_ALREADY_EXISTS',
          message: `El slug "${slug}" ya está en uso`,
          field: 'slug',
          value: slug
        });
      }

      if (existingByDomain) {
        throw new ConflictException({
          error: 'DOMAIN_ALREADY_EXISTS',
          message: `El dominio "${domain}" ya está en uso`,
          field: 'domain',
          value: domain
        });
      }

      // Crear el tenant principal
      const tenantData = {
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain,
        contactEmail: dto.contactEmail,
        plan: dto.plan || 'free'
      };

      const tenant = this.tenantRepository.create(tenantData);
      const savedTenant = await queryRunner.manager.save(tenant);

      // Crear la configuración del tenant
      const configData = {
        tenant: savedTenant,
        status: dto.config?.status ?? true,
        primaryColor: dto.config?.primaryColor || dto.primaryColor || '#007bff',
        secondaryColor: dto.config?.secondaryColor || dto.secondaryColor || '#6c757d',
        maxUsers: dto.config?.maxUsers || dto.maxUsers || 10,
        storageLimit: dto.config?.storageLimit || dto.storageLimit || 150, // GB
        timezone: dto.timezone || 'America/Bogota',
        language: dto.language || 'es-CO'
      };

      const tenantConfig = this.tenantConfigRepository.create(configData);
      await queryRunner.manager.save(tenantConfig);

      // Crear la información de contacto del tenant
      const contactInfoData = {
        tenant: savedTenant,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        contactEmail: dto.contactEmail || `contact@${dto.domain}`
      };

      const tenantContactInfo = this.tenantContactInfoRepository.create(contactInfoData);
      await queryRunner.manager.save(tenantContactInfo);


      // Crear la configuracion de personalizacion de las vistas
      const viewConfigData = {
        tenant: savedTenant,
        viewType: dto.homeSettings.type as ViewType,
        allowBackground: dto.homeSettings.customBackground,
        backgroundType: dto.homeSettings.backgroundType as 'image' | 'color' | 'none',
        backgroundColor: dto.homeSettings.backgroundColor,
        backgroundImagePath: dto.homeSettings.backgroundImage
      };

      const tenantViewConfig = this.tenantViewConfigRepository.create(viewConfigData);
      await queryRunner.manager.save(tenantViewConfig);

      // Commit de la transacción
      await queryRunner.commitTransaction();

      // Buscar el tenant con todas sus relaciones
      const tenantWithRelations = await this.tenantRepository.findOne({
        where: { id: savedTenant.id },
        relations: ['config', 'contactInfo']
      });

      if (!tenantWithRelations) {
        throw new BadRequestException({
          error: 'TENANT_NOT_FOUND_AFTER_CREATION',
          message: 'Error interno: No se pudo recuperar el tenant después de crearlo'
        });
      }

      console.log("Tenant created successfully:", savedTenant.id);
      return tenantWithRelations;
      
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      console.log("Error in create method:", error);
      
      // Si ya es una excepción HTTP, la re-lanzamos
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Para otros errores (como errores de BD)
      throw new BadRequestException({
        error: 'DATABASE_ERROR',
        message: 'Error al crear el tenant en la base de datos',
        details: error.message
      });
    } finally {
      // Liberar la conexión
      await queryRunner.release();
    }
  }

  private async validateTenantData(dto: CreateTenantDto): Promise<void> {
    console.log("Validating tenant data:", dto);
    
    // Validaciones adicionales de negocio
    if (dto.slug.includes('admin') || dto.slug.includes('api')) {
      throw new BadRequestException({
        error: 'RESERVED_SLUG',
        message: 'El slug contiene palabras reservadas',
        field: 'slug',
        value: dto.slug
      });
    }

    // Validar dominio
    if (dto.domain.includes('localhost') && process.env.NODE_ENV === 'production') {
      throw new BadRequestException({
        error: 'INVALID_DOMAIN',
        message: 'No se permite localhost en producción',
        field: 'domain',
        value: dto.domain
      });
    }

    // Validar que el dominio tenga el formato correcto
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(dto.domain)) {
      throw new BadRequestException({
        error: 'INVALID_DOMAIN_FORMAT',
        message: 'El formato del dominio no es válido',
        field: 'domain',
        value: dto.domain
      });
    }

    console.log("Tenant data validation passed");
  }

  async findAll(): Promise<Tenant[]> {
    return await this.tenantRepository.find();
  }

  async findAllPaginated(queryDto: TenantQueryDto): Promise<PaginatedTenantsResponseDto> {
    const { 
      search, 
      plan, 
      isActive, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = queryDto;

    const queryBuilder: SelectQueryBuilder<Tenant> = this.tenantRepository.createQueryBuilder('tenant');

    // se agregan relacioens de config tenant
    queryBuilder
    .leftJoinAndSelect('tenant.config', 'config')
    .leftJoinAndSelect('tenant.users', 'users');

    // Aplicar filtros
    if (search) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.domain ILIKE :search OR tenant.contactEmail ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (plan) {
      queryBuilder.andWhere('tenant.plan = :plan', { plan });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('tenant.isActive = :isActive', { isActive });
    }

    // Aplicar ordenamiento
    const validSortFields = ['name', 'domain', 'plan', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`tenant.${sortField}`, sortOrder);

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ejecutar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    // Agregar currentUsers al config
    for (const tenant of data) {
      const currentUsers = tenant.users?.length ?? 0;

      if (tenant.config) {
        tenant.config['currentUsers'] = currentUsers;
      } else {
        tenant.config = { currentUsers } as any;
      }
    }

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ 
      where: { id },
      relations: [
        'config',
        'contactInfo',
        'viewConfigs',
        'componentConfigs'
      ]
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${id} no encontrado`);
    }

    // Contar usuarios del tenant
    const totalUsers = await this.userRepository.count({
      where: { tenant: { id } }
    });

    // Agregar totalUsers al objeto config
    if (tenant.config) {
      (tenant.config as any).currentUsers = totalUsers;
    }

    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { slug },
      relations: [
        'config',
        'contactInfo',
        'viewConfigs',
        'componentConfigs'
      ]
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con slug '${slug}' no encontrado`);
    }

    const totalUsers = await this.userRepository.count({
      where: { tenant: { slug } }
    });

    if (tenant.config) {
      (tenant.config as any).currentUsers = totalUsers;
    }

    return tenant;
  }


  async checkClientSubscriptionStatus(clientId: string) {
    // Buscar el tenant por client_id_mz
    const tenant = await this.tenantRepository.findOne({
      where: { client_id_mz: clientId },
      relations: ['subscriptions', 'subscriptions.product']
    });

    if (!tenant) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        expiresAt: null,
        planName: null,
        stripeStatus: null,
        trialInfo: null
      };
    }

    // Buscar suscripciones activas
    const activeSubscriptions = tenant.subscriptions.filter(sub => sub.isActive());

    if (activeSubscriptions.length === 0) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        expiresAt: null,
        planName: null,
        stripeStatus: null,
        trialInfo: null
      };
    }

    // Tomar la primera suscripción activa (podrías tener lógica para múltiples)
    const subscription = activeSubscriptions[0];

    // Verificar estado en Stripe para estar seguros
    const stripeStatus = await this.verifySubscriptionWithStripe(subscription.stripe_subscription_id);

    // Si Stripe dice que no está activa, actualizar nuestro registro
    if (!this.isStripeStatusActive(stripeStatus.status)) {
      subscription.status = stripeStatus.status;
      subscription.canceled_at = stripeStatus.canceled_at ? new Date(stripeStatus.canceled_at * 1000) : null;
      subscription.ended_at = stripeStatus.ended_at ? new Date(stripeStatus.ended_at * 1000) : null;
      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Notificar a Laravel sobre el cambio de estado
      await this.laravelWebhookService.notifySubscriptionUpdated(
        tenant.client_id_mz,
        updatedSubscription
      );

      return {
        hasActiveSubscription: false,
        subscription: subscription,
        expiresAt: subscription.current_period_end,
        planName: subscription.product?.title,
        stripeStatus: stripeStatus.status,
        trialInfo: subscription.isInTrial() ? {
          isInTrial: true,
          trialEnd: subscription.trial_end
        } : null
      };
    }

    return {
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        interval_count: subscription.interval_count
      },
      expiresAt: subscription.current_period_end,
      planName: subscription.product?.title,
      stripeStatus: stripeStatus.status,
      trialInfo: subscription.isInTrial() ? {
        isInTrial: true,
        trialEnd: subscription.trial_end
      } : null
    };
  }

  // async createSubscriptionFromStripe(createSubscriptionDto: CreateSubscriptionDto) {
  //   // Buscar el tenant
  //   const tenant = await this.tenantRepository.findOne({
  //     where: { client_id_mz: createSubscriptionDto.client_id_mz }
  //   });

  //   if (!tenant) {
  //     throw new Error('Tenant not found');
  //   }

  //   // Buscar el producto
  //   const product = await this.tenantProductRepository.findOne({
  //     where: { 
  //       tenant_id: tenant.id,
  //       laravel_plan_id: createSubscriptionDto.laravel_plan_id 
  //     }
  //   });

  //   if (!product) {
  //     throw new Error('Product not found');
  //   }

  //   // Verificar que no exista ya una suscripción con el mismo stripe_subscription_id
  //   const existingSubscription = await this.subscriptionRepository.findOne({
  //     where: { stripe_subscription_id: createSubscriptionDto.stripe_subscription_id }
  //   });

  //   if (existingSubscription) {
  //     return existingSubscription;
  //   }

  //   // Crear nueva suscripción
  //   const subscription = this.subscriptionRepository.create({
  //     tenant: { id: tenant.id },
  //     product: { id: product.id },
  //     laravel_user_id: createSubscriptionDto.laravel_user_id,
  //     user_email: createSubscriptionDto.user_email,
  //     stripe_subscription_id: createSubscriptionDto.stripe_subscription_id,
  //     stripe_customer_id: createSubscriptionDto.stripe_customer_id,
  //     stripe_price_id: createSubscriptionDto.stripe_price_id,
  //     status: createSubscriptionDto.status,
  //     current_period_start: new Date(createSubscriptionDto.current_period_start * 1000),
  //     current_period_end: new Date(createSubscriptionDto.current_period_end * 1000),
  //     trial_start: createSubscriptionDto.trial_start ? new Date(createSubscriptionDto.trial_start * 1000) : null,
  //     trial_end: createSubscriptionDto.trial_end ? new Date(createSubscriptionDto.trial_end * 1000) : null,
  //     amount: createSubscriptionDto.amount,
  //     currency: createSubscriptionDto.currency,
  //     interval: createSubscriptionDto.interval,
  //     interval_count: createSubscriptionDto.interval_count,
  //     stripe_metadata: createSubscriptionDto.metadata
  //   });

  //   return this.subscriptionRepository.save(subscription);
  // }

  async updateSubscriptionFromStripe(stripeSubscriptionId: string, updateData: any) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscriptionId },
      relations: ['tenant']
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Actualizar campos
    Object.assign(subscription, {
      status: updateData.status,
      current_period_start: new Date(updateData.current_period_start * 1000),
      current_period_end: new Date(updateData.current_period_end * 1000),
      canceled_at: updateData.canceled_at ? new Date(updateData.canceled_at * 1000) : null,
      ended_at: updateData.ended_at ? new Date(updateData.ended_at * 1000) : null,
      stripe_metadata: updateData.metadata
    });

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Notificar a Laravel usando la relación tenant
    if (subscription.tenant && subscription.tenant.client_id_mz) {
      await this.laravelWebhookService.notifySubscriptionUpdated(
        subscription.tenant.client_id_mz,
        updatedSubscription
      );
    }

    return updatedSubscription;
  }

  async getTenantSubscriptions(tenantId: string) {
    return this.subscriptionRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['product', 'tenant'],
      order: { createdAt: 'DESC' }
    });
  }

  private async verifySubscriptionWithStripe(stripeSubscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error verifying subscription with Stripe:', error);
      throw error;
    }
  }

  private isStripeStatusActive(status: string): boolean {
    return ['active', 'trialing'].includes(status);
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
    await this.createStripeProduct(savedProduct);

    return savedProduct;
  }

  // Método para actualizar producto en Stripe
  private async updateStripeProduct(tenantProduct: TenantProduct): Promise<void> {
    try {
      if (!tenantProduct.stripe_product_id) {
        // Si no tiene ID de Stripe, crear uno nuevo
        await this.createStripeProduct(tenantProduct);
        return;
      }

      this.logger.log(`Actualizando producto en Stripe: ${tenantProduct.stripe_product_id}`);
      
      // Actualizar producto en Stripe
      await this.stripe.products.update(tenantProduct.stripe_product_id, {
        name: tenantProduct.title,
        description: tenantProduct.description || '',
        active: tenantProduct.is_active,
        metadata: {
          tenant_id: tenantProduct.tenant_id,
          laravel_plan_id: tenantProduct.laravel_plan_id,
          internal_product_id: tenantProduct.id
        },
      });

      // Si el precio cambió, crear un nuevo precio y desactivar el anterior
      if (tenantProduct.stripe_price_id) {
        const currentPrice = await this.stripe.prices.retrieve(tenantProduct.stripe_price_id);
        const newPriceAmount = Math.round(tenantProduct.price * 100);
        
        if (currentPrice.unit_amount !== newPriceAmount) {
          // Desactivar precio anterior
          await this.stripe.prices.update(tenantProduct.stripe_price_id, {
            active: false
          });

          // Crear nuevo precio
          let newStripePrice: Stripe.Price;
          
          if (tenantProduct.type_payment === 'recurring' && tenantProduct.recurring) {
            newStripePrice = await this.stripe.prices.create({
              unit_amount: newPriceAmount,
              currency: tenantProduct.currency.toLowerCase(),
              recurring: {
                interval: tenantProduct.recurring.interval || 'month',
                interval_count: tenantProduct.recurring.interval_count || 1,
              },
              product: tenantProduct.stripe_product_id,
              metadata: {
                tenant_id: tenantProduct.tenant_id,
                laravel_plan_id: tenantProduct.laravel_plan_id,
              },
            });
          } else {
            newStripePrice = await this.stripe.prices.create({
              unit_amount: newPriceAmount,
              currency: tenantProduct.currency.toLowerCase(),
              product: tenantProduct.stripe_product_id,
              metadata: {
                tenant_id: tenantProduct.tenant_id,
                laravel_plan_id: tenantProduct.laravel_plan_id,
              },
            });
          }

          // Actualizar con el nuevo precio ID
          tenantProduct.stripe_price_id = newStripePrice.id;
          await this.tenantProductRepository.save(tenantProduct);
          
          this.logger.log(`Nuevo precio creado en Stripe con ID: ${newStripePrice.id}`);
        }
      }
      
      this.logger.log(`Producto actualizado exitosamente en Stripe`);
      
    } catch (error) {
      this.logger.error('Error actualizando producto en Stripe:', error.message);
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Error de Stripe al actualizar: ${error.message}`);
      }
      throw new InternalServerErrorException('Error interno al actualizar en Stripe.');
    }
  }

  // Método para eliminar producto de Stripe
  async deleteStripeProduct(tenantProduct: TenantProduct): Promise<void> {
    try {
      if (tenantProduct.stripe_product_id) {
        this.logger.log(`Desactivando producto en Stripe: ${tenantProduct.stripe_product_id}`);
        
        // Stripe no permite eliminar productos, solo desactivarlos
        await this.stripe.products.update(tenantProduct.stripe_product_id, {
          active: false
        });
        
        this.logger.log(`Producto desactivado en Stripe`);
      }
    } catch (error) {
      this.logger.error('Error desactivando producto en Stripe:', error.message);
      // No lanzar error aquí para no bloquear la eliminación local
    }
  }

  // Método para crear producto en Stripe (implementar según necesidades)
  private async createStripeProduct(tenantProduct: TenantProduct): Promise<void> {
    try {
      this.logger.log(`Creando producto en Stripe: ${tenantProduct.title}`);
      
      // Crear producto en Stripe
      const stripeProduct = await this.stripe.products.create({
        name: tenantProduct.title,
        description: tenantProduct.description || '',
        metadata: {
          tenant_id: tenantProduct.tenant_id,
          laravel_plan_id: tenantProduct.laravel_plan_id,
          internal_product_id: tenantProduct.id
        },
      });
      
      this.logger.log(`Producto creado en Stripe con ID: ${stripeProduct.id}`);

      // Crear precio en Stripe
      let stripePrice: Stripe.Price;
      
      if (tenantProduct.type_payment === 'recurring' && tenantProduct.recurring) {
        // Precio recurrente
        stripePrice = await this.stripe.prices.create({
          unit_amount: Math.round(tenantProduct.price * 100), // Convertir a centavos
          currency: tenantProduct.currency.toLowerCase(),
          recurring: {
            interval: tenantProduct.recurring.interval || 'month',
            interval_count: tenantProduct.recurring.interval_count || 1,
          },
          product: stripeProduct.id,
          metadata: {
            tenant_id: tenantProduct.tenant_id,
            laravel_plan_id: tenantProduct.laravel_plan_id,
          },
        });
      } else {
        // Precio único
        stripePrice = await this.stripe.prices.create({
          unit_amount: Math.round(tenantProduct.price * 100), // Convertir a centavos
          currency: tenantProduct.currency.toLowerCase(),
          product: stripeProduct.id,
          metadata: {
            tenant_id: tenantProduct.tenant_id,
            laravel_plan_id: tenantProduct.laravel_plan_id,
          },
        });
      }

      this.logger.log(`Precio creado en Stripe con ID: ${stripePrice.id}`);

      // Actualizar el producto local con los IDs de Stripe
      tenantProduct.stripe_product_id = stripeProduct.id;
      tenantProduct.stripe_price_id = stripePrice.id;
      
      await this.tenantProductRepository.save(tenantProduct);
      
      this.logger.log(`Producto y precio vinculados exitosamente: Producto ID ${stripeProduct.id}, Precio ID ${stripePrice.id}`);
      
    } catch (error) {
      this.logger.error('Error creando producto y precio en Stripe:', error.message);
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Error de Stripe: ${error.message}`);
      }
      throw new InternalServerErrorException('Error interno al procesar con Stripe.');
    }
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
      relations: ['config', 'contactInfo', 'componentConfigs', 'viewConfigs']
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
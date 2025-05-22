import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
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

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return await this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<DeleteResult> {
    return await this.tenantRepository.delete(id);
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { domain },
      relations: ['config', 'contactInfo']
    });
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
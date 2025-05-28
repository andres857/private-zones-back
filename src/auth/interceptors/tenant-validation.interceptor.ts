// src/common/interceptors/tenant-validation.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
    UnauthorizedException,
    Logger,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { TenantsService } from '../../tenants/tenants.service';
  
  @Injectable()
  export class TenantValidationInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TenantValidationInterceptor.name);
  
    constructor(private readonly tenantsService: TenantsService) {}
  
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      
      // Estrategia de múltiples fuentes para obtener el dominio del tenant
      const tenantDomain = this.extractTenantDomain(request);
      
      this.logger.log(`TenantValidationInterceptor - Extracted domain: ${tenantDomain}`);
  
      if (!tenantDomain) {
        throw new BadRequestException('No se pudo determinar el dominio del tenant');
      }
  
      try {
        // Buscar el tenant por dominio
        const tenant = await this.tenantsService.findByDomain(tenantDomain);
        
        if (!tenant) {
          this.logger.warn(`Tenant not found for domain: ${tenantDomain}`);
          throw new UnauthorizedException('Tenant no encontrado para este dominio');
        }
  
        this.logger.log(`Tenant validated successfully: ${tenant.name} (${tenant.id})`);
  
        // Agregar información del tenant al request para uso posterior
        request.tenant = tenant;
        request.body.tenantId = tenant.id;
        request.body.tenantDomain = tenant.domain;
  
        return next.handle();
  
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
          throw error;
        }
        
        this.logger.error(`Error validating tenant for domain ${tenantDomain}:`, error);
        throw new BadRequestException('Error al validar el tenant');
      }
    }
  
    /**
     * Extrae el dominio del tenant usando múltiples estrategias:
     * 1. Header X-Tenant-Domain
     * 2. Header X-Tenant-ID (si es un dominio)
     * 3. Body tenantId/tenantDomain
     * 4. Query parameter domain
     * 5. Origen de la petición (Host/Origin headers)
     */
    private extractTenantDomain(request: any): string | null {
      // 1. Prioridad: Header específico para tenant domain
      const headerDomain = request.headers['x-tenant-domain'];
      if (headerDomain) {
        this.logger.debug(`Domain from X-Tenant-Domain header: ${headerDomain}`);
        return headerDomain;
      }
  
      // 2. Header X-Tenant-ID (podría ser un dominio)
      const headerTenantId = request.headers['x-tenant-id'];
      if (headerTenantId && this.looksLikeDomain(headerTenantId)) {
        this.logger.debug(`Domain from X-Tenant-ID header: ${headerTenantId}`);
        return headerTenantId;
      }
  
      // 3. Body del request
      const queryDomain = request.query?.domain || request.query?.tenantDomain;
      if (queryDomain) {
        this.logger.debug(`Domain from query parameter: ${queryDomain}`);
        return queryDomain;
      }
  
      // 4. Query parameters
      const originDomain = this.extractDomainFromOrigin(request);
      if (originDomain) {
        this.logger.debug(`Domain extracted from origin: ${originDomain}`);
        return originDomain;
      }
  
      return null;
    }
  
    /**
     * Extrae el dominio del header Host u Origin
     */
    private extractDomainFromOrigin(request: any): string | null {
      // Intentar con el header Origin primero
      const origin = request.headers.origin;
      if (origin) {
        try {
          const url = new URL(origin);
          return url.hostname;
        } catch (error) {
          this.logger.warn(`Invalid origin URL: ${origin}`);
        }
      }
  
      // Fallback al header Host
      const host = request.headers.host;
      if (host) {
        // Remover puerto si existe
        const hostname = host.split(':')[0];
        return hostname;
      }
  
      return null;
    }
  
    /**
     * Verifica si un string parece ser un dominio
     */
    private looksLikeDomain(value: string): boolean {
      if (!value || typeof value !== 'string') {
        return false;
      }
  
      // Patrones básicos para identificar dominios
      const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|test|local)$/;
      const localhostPattern = /^localhost(:\d+)?$/;
      const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;
      
      return domainPattern.test(value) || 
             localhostPattern.test(value) || 
             ipPattern.test(value) ||
             value.includes('.test') ||
             value.includes('.local');
    }
  }
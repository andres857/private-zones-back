// exceptions/tenant.exceptions.ts
import { BadRequestException, ConflictException } from '@nestjs/common';

export class TenantAlreadyExistsException extends ConflictException {
  constructor(slug: string, domain: string) {
    super({
      error: 'TENANT_ALREADY_EXISTS',
      message: `Ya existe un tenant con el slug "${slug}" o dominio "${domain}"`,
      details: { slug, domain }
    });
  }
}

export class InvalidTenantDataException extends BadRequestException {
  constructor(field: string, value: string, reason: string) {
    super({
      error: 'INVALID_TENANT_DATA',
      message: `Campo "${field}" es inválido: ${reason}`,
      details: { field, value, reason }
    });
  }
}
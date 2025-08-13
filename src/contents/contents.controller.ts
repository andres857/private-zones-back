// src/contents/contents.controller.ts
import { Controller, Get, Param, Query, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';

export interface GetContentOptions {
  includeCourse?: boolean;
  includeModule?: boolean;
  includeNavigation?: boolean;
}

@Controller('contents')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get(':contentId')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('contentId') contentId: string,
    @Query('includeCourse') includeCourse?: string,
    @Query('includeModule') includeModule?: string,
    @Query('includeNavigation') includeNavigation?: string,
  ) {
    const userId = request.user?.['id'];
    const tenantId = request.tenant?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!tenantId) {
      throw new Error('Tenant not validated');
    }

    const options: GetContentOptions = {
      includeCourse: includeCourse === 'true',
      includeModule: includeModule === 'true', 
      includeNavigation: includeNavigation === 'true'
    };

    return await this.contentsService.getById(contentId, options, userId, tenantId);
  }
}
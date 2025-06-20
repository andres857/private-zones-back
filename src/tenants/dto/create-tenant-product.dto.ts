import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class CreateTenantProductDto {
  @IsString()
  client_id_mz: string;

  @IsString()
  laravel_plan_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  currency: string;

  @IsString()
  type_payment: string;

  @IsOptional()
  @IsObject()
  recurring?: any;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsNumber()
  max_users?: number;

  @IsOptional()
  @IsNumber()
  max_storage_gb?: number;

  @IsOptional()
  @IsArray()
  modules_access?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsNumber()
  trial_period_days?: number;

  @IsOptional()
  @IsNumber()
  setup_fee?: number;

  // Datos del tenant si no existe
  @IsOptional()
  @IsString()
  tenant_name?: string;

  @IsOptional()
  @IsString()
  tenant_slug?: string;

  @IsOptional()
  @IsString()
  tenant_domain?: string;

  @IsOptional()
  @IsString()
  tenant_contact_email?: string;
}
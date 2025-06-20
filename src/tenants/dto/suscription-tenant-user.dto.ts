import { IsString, IsNumber, IsOptional, IsEmail, IsObject } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  client_id_mz: string;

  @IsString()
  laravel_plan_id: string;

  @IsString()
  laravel_user_id: string;

  @IsEmail()
  user_email: string;

  @IsString()
  stripe_subscription_id: string;

  @IsString()
  stripe_customer_id: string;

  @IsString()
  stripe_price_id: string;

  @IsString()
  status: string;

  @IsNumber()
  current_period_start: number; // Unix timestamp

  @IsNumber()
  current_period_end: number; // Unix timestamp

  @IsOptional()
  @IsNumber()
  trial_start?: number; // Unix timestamp

  @IsOptional()
  @IsNumber()
  trial_end?: number; // Unix timestamp

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  interval: string;

  @IsNumber()
  interval_count: number;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
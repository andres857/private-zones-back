import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsIn } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1) // Stripe espera el monto en centavos, así que asegúrate de que sea al menos 1 centavo
  unit_amount: number; // ej: 1200 para $12.00

  @IsString()
  @IsNotEmpty()
  currency: string; // ej: 'usd', 'eur'

  @IsString()
  @IsNotEmpty()
  @IsIn(['day', 'week', 'month', 'year'])
  interval: 'day' | 'week' | 'month' | 'year';
}
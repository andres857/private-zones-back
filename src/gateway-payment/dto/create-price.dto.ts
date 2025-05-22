import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsIn } from 'class-validator';


export class CreatePriceDto {
    @IsString()
    @IsNotEmpty()
    productId: string;
    
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

    @IsOptional()
    @IsString()
    nickname?: string; // Nombre opcional para el precio

    @IsOptional()
    @IsString()
    description?: string; // Descripción opcional para el precio

    @IsOptional()
    @IsString()
    recurring?: string; // Información adicional opcional para la recurrencia

    @IsOptional()
    @IsString()
    active?: string; // Estado opcional para el precio

    @IsOptional()
    @IsString()
    metadata?: string; // Metadatos opcionales para el precio

    @IsOptional()
    @IsString()
    transform_quantity?: string; // Transformación opcional de la cantidad

    @IsOptional()
    @IsString()
    tiers_mode?: string; // Modo opcional de niveles

    @IsOptional()
    @IsString()
    tiers?: string; // Niveles opcionales para el precio
}
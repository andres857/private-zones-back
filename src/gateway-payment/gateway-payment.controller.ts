import { Controller, Post, Body, Get, Param, Query, UsePipes, ValidationPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { StripeService } from './gateway-payment.service';
import { CreateProductDto } from './dto/create-product.dto';
import Stripe from 'stripe';

@Controller('gateway-payment/stripe')
export class GatewayPaymentController {
    constructor(private readonly stripeService: StripeService) {}

    @Post('products')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        async createProductAndPrice(@Body() createProductDto: CreateProductDto): Promise<{ product_id: string; price_id: string }> {
        const { product, price } = await this.stripeService.createProductAndPrice(createProductDto);
        return {
            product_id: product.id,
            price_id: price.id,
        };
    }

    @Get('products')
    async getAllProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
    ): Promise<Stripe.ApiList<Stripe.Product>> {
        return this.stripeService.findAllProducts(limit);
    }

    @Get('products/:id')
    async getProductById(@Param('id') id: string): Promise<Stripe.Product> {
        return this.stripeService.findProductById(id);
    }

    @Get('prices')
    async getAllPrices(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('productId') productId?: string, // Opcional para filtrar precios por producto
    ): Promise<Stripe.ApiList<Stripe.Price>> {
        return this.stripeService.findAllPrices(limit, productId);
    }

    @Get('prices/:id')
    async getPriceById(@Param('id') id: string): Promise<Stripe.Price> {
        return this.stripeService.findPriceById(id);
    }
}

import { Injectable, Inject, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(@Inject('STRIPE_API') private readonly stripe: Stripe) {}

  async createProductAndPrice(createProductDto: CreateProductDto): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
    const { name, description, unit_amount, currency, interval } = createProductDto;

    try {
      this.logger.log(`Creando producto: ${name}`);
      const product = await this.stripe.products.create({
        name,
        description,
        // puedes añadir más campos como metadata, images, etc.
      });
      this.logger.log(`Producto creado con ID: ${product.id}`);

      this.logger.log(`Creando precio para producto ${product.id}`);
      const price = await this.stripe.prices.create({
        unit_amount,
        currency,
        recurring: {
          interval,
        },
        product: product.id,
      });
      this.logger.log(`Precio creado con ID: ${price.id} para producto ${product.id}`);

      return { product, price };
    } catch (error) {
      this.logger.error('Error creando producto y precio en Stripe:', error.message);
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Error de Stripe: ${error.message}`);
      }
      throw new InternalServerErrorException('Error interno al procesar con Stripe.');
    }
  }

  async findAllProducts(limit: number = 10): Promise<Stripe.ApiList<Stripe.Product>> {
    try {
      this.logger.log('Consultando todos los productos');
      return await this.stripe.products.list({ limit });
    } catch (error) {
      this.logger.error('Error consultando productos en Stripe:', error.message);
      throw new InternalServerErrorException('Error al obtener productos de Stripe.');
    }
  }

  async findProductById(id: string): Promise<Stripe.Product> {
    try {
      this.logger.log(`Consultando producto con ID: ${id}`);
      const product = await this.stripe.products.retrieve(id);
      if (!product) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
      }
      return product;
    } catch (error) {
      this.logger.error(`Error consultando producto ${id} en Stripe:`, error.message);
      if (error instanceof Stripe.errors.StripeError && error.statusCode === 404) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado en Stripe.`);
      }
      throw new InternalServerErrorException('Error al obtener el producto de Stripe.');
    }
  }

  async findAllPrices(limit: number = 10, productId?: string): Promise<Stripe.ApiList<Stripe.Price>> {
    try {
      const params: Stripe.PriceListParams = { limit };
      if (productId) {
        params.product = productId;
        this.logger.log(`Consultando precios para el producto ID: ${productId}`);
      } else {
        this.logger.log('Consultando todos los precios');
      }
      return await this.stripe.prices.list(params);
    } catch (error) {
      this.logger.error('Error consultando precios en Stripe:', error.message);
      throw new InternalServerErrorException('Error al obtener precios de Stripe.');
    }
  }

  async findPriceById(id: string): Promise<Stripe.Price> {
    try {
      this.logger.log(`Consultando precio con ID: ${id}`);
      const price = await this.stripe.prices.retrieve(id);
      if (!price) {
        throw new NotFoundException(`Precio con ID ${id} no encontrado.`);
      }
      return price;
    } catch (error) {
      this.logger.error(`Error consultando precio ${id} en Stripe:`, error.message);
      if (error instanceof Stripe.errors.StripeError && error.statusCode === 404) {
        throw new NotFoundException(`Precio con ID ${id} no encontrado en Stripe.`);
      }
      throw new InternalServerErrorException('Error al obtener el precio de Stripe.');
    }
  }
}

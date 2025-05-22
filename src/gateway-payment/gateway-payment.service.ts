import { Injectable, Inject, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from './dto/create-product.dto';
import { CreatePriceDto } from './dto/create-price.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly frontendUrl: string;

  constructor(
    @Inject('STRIPE_API') private readonly stripe: Stripe,
    private configService: ConfigService
  ) {
    // Obtener la URL del frontend desde las variables de entorno
    // this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3020';
    this.frontendUrl = 'http://localhost:5173';
  }

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

  // async createPrice(createPriceDto: CreatePriceDto): Promise<Stripe.Price> {
  //   const { unit_amount, currency, recurring, product } = createPriceDto;
  //   try {
  //     this.logger.log(`Creando precio para el producto ID: ${product}`);
  //     const price = await this.stripe.prices.create({
  //       unit_amount,
  //       currency,
  //       recurring,
  //       product,
  //     });
  //     this.logger.log(`Precio creado con ID: ${price.id}`);
  //     return price;
  //   }
  //   catch (error) {
  //     this.logger.error('Error creando precio en Stripe:', error.message);
  //     if (error instanceof Stripe.errors.StripeError) {
  //       throw new BadRequestException(`Error de Stripe: ${error.message}`);
  //     }
  //     throw new InternalServerErrorException('Error interno al procesar con Stripe.');
  //   }
  // }

  async listPaymentMethods(customerId: string): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    try {
      this.logger.log(`Consultando métodos de pago para el cliente ID: ${customerId}`);
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
      });
      if (!paymentMethods) {
        throw new NotFoundException(`Métodos de pago para el cliente ID ${customerId} no encontrados.`);
      }
      return paymentMethods;
    } catch (error) {
      this.logger.error(`Error consultando métodos de pago para el cliente ${customerId} en Stripe:`, error.message);
      if (error instanceof Stripe.errors.StripeError && error.statusCode === 404) {
        throw new NotFoundException(`Métodos de pago para el cliente ID ${customerId} no encontrados en Stripe.`);
      }
      throw new InternalServerErrorException('Error al obtener métodos de pago de Stripe.');
    }
  }

  // crear una sesión de checkout
  async createCheckoutSession(productId: string): Promise<{ url: string }> {
    try {
      this.logger.log(`Creando sesión de checkout para el producto ID: ${productId}`);
      
      // Obtener el producto
      const product = await this.findProductById(productId);
      
      // Buscar un precio asociado al producto
      const prices = await this.findAllPrices(1, productId);
      
      // Si no hay precios, crear uno temporal
      if (prices.data.length > 0) {
        const priceId = prices.data[0].id;
        this.logger.log(`Usando precio existente ID: ${priceId}`);
        
        // Verificar si el precio es recurrente (subscription)
        const price = await this.findPriceById(priceId);
        const isRecurring = price.recurring !== null;
        
        // Crear la sesión de checkout con el precio existente
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          // Usar el modo 'subscription' si el precio es recurrente, de lo contrario 'payment'
          mode: isRecurring ? 'subscription' : 'payment',
          currency: 'cop',
          success_url: `${this.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${this.frontendUrl}/checkout/canceled`,
        });
        
        this.logger.log(`Sesión de checkout creada: ${session.id}`);
        
        // Verificar que la URL no sea null
        if (!session.url) {
          throw new InternalServerErrorException('No se pudo generar la URL de sesión de checkout');
        }
        
        return { url: session.url };
      } else {
        // Si no hay un precio, usar un valor predeterminado
        this.logger.log(`No se encontró precio para el producto ${productId}, creando sesión con precio por defecto`);
        
        // Crear la sesión de checkout directamente con price_data
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'cop',
                product_data: {
                  name: product.name,
                  description: product.description || '',
                  images: product.images || [],
                },
                unit_amount: 3000, // 3.000 pesos colombianos (no tiene centavos)
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${this.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${this.frontendUrl}/checkout/canceled`,
        });
        
        this.logger.log(`Sesión de checkout creada: ${session.id}`);
        
        // Verificar que la URL no sea null
        if (!session.url) {
          throw new InternalServerErrorException('No se pudo generar la URL de sesión de checkout');
        }
        
        return { url: session.url };
      }
    } catch (error) {
      this.logger.error(`Error creando sesión de checkout: ${error.message}`);
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Error de Stripe: ${error.message}`);
      }
      throw new InternalServerErrorException('Error al crear la sesión de checkout.');
    }
  }
}
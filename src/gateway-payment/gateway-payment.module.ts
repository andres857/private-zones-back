import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './gateway-payment.service';
import { GatewayPaymentController } from './gateway-payment.controller';

@Global()
@Module({
  imports: [ConfigModule], // Asegúrate de que ConfigModule esté importado globalmente o aquí
  providers: [
    {
      provide: 'STRIPE_API',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.getOrThrow<string>('STRIPE_SECRET_KEY');
        return new Stripe(apiKey, {
          apiVersion: '2023-10-16' as any, // Usa la última versión de API compatible
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  controllers: [GatewayPaymentController],
  exports: [StripeService, 'STRIPE_API'], // Exporta el servicio y la instancia si es necesario en otros módulos
})
export class GatewayPaymentModule {}

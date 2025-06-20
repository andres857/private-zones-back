import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LaravelWebhookService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Notificar a Laravel que el estado de suscripción ha cambiado
   */
  async notifySubscriptionStatusChange(clientId: string, subscriptionData?: any): Promise<void> {
    try {
      const laravelApiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000';
      const apiToken = process.env.LARAVEL_API_TOKEN || process.env.API_SECRET_KEY;

      if (!apiToken) {
        console.warn('Laravel API token not configured, skipping webhook notification');
        return;
      }

      const payload = {
        client_id: clientId,
        subscription_data: subscriptionData,
        timestamp: new Date().toISOString()
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${laravelApiUrl}/api/subscription/webhook/status-change`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        )
      );

      console.log('Laravel webhook notification sent successfully', {
        client_id: clientId,
        response_status: response.status
      });

    } catch (error) {
      console.error('Failed to notify Laravel of subscription status change', {
        client_id: clientId,
        error: error.message
      });
      // No lanzamos la excepción para no interrumpir el flujo principal
    }
  }

  /**
   * Notificar a Laravel cuando se crea una nueva suscripción
   */
  async notifySubscriptionCreated(clientId: string, subscription: any): Promise<void> {
    await this.notifySubscriptionStatusChange(clientId, {
      action: 'created',
      subscription: subscription
    });
  }

  /**
   * Notificar a Laravel cuando se actualiza una suscripción
   */
  async notifySubscriptionUpdated(clientId: string, subscription: any): Promise<void> {
    await this.notifySubscriptionStatusChange(clientId, {
      action: 'updated',
      subscription: subscription
    });
  }

  /**
   * Notificar a Laravel cuando se cancela una suscripción
   */
  async notifySubscriptionCanceled(clientId: string, subscription: any): Promise<void> {
    await this.notifySubscriptionStatusChange(clientId, {
      action: 'canceled',
      subscription: subscription
    });
  }
}
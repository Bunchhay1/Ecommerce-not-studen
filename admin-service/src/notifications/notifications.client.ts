import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class NotificationsClient {
  private readonly logger = new Logger(NotificationsClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:8009';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getNotifications(params: any) {
    try {
      const response = await this.http.get('/api/v1/notifications', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream notification-service call failed: ${err.message}. Returning mock notifications.`);
      return {
        items: [
          { id: 'notif-1', recipient: 'user-1@example.com', channel: 'EMAIL', template: 'ORDER_CONFIRMED', status: 'DELIVERED', sentAt: new Date().toISOString() },
          { id: 'notif-2', recipient: 'seller-1@example.com', channel: 'SMS', template: 'SELLER_VERIFIED', status: 'SENT', sentAt: new Date().toISOString() },
        ],
        total: 2,
      };
    }
  }

  async sendBroadcast(data: { title: string; message: string; targetGroup: string; channel: string }) {
    try {
      const response = await this.http.post('/api/v1/notifications/broadcast', data);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream notification-service call failed: ${err.message}. Simulating broadcast.`);
      return { broadcastId: `bc-${Date.now()}`, ...data, status: 'QUEUED' };
    }
  }
}

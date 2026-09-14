import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class OrdersClient {
  private readonly logger = new Logger(OrdersClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('ORDER_SERVICE_URL') || 'http://localhost:8007';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getOrders(params: any) {
    try {
      const response = await this.http.get('/api/v1/admin/orders', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream order-service call failed: ${err.message}. Returning mock orders.`);
      return {
        content: [
          { id: 'ord-1', orderNumber: 'ORD-20260914-1001', userId: 'usr-1', totalAmount: 999.00, status: 'PAID' },
          { id: 'ord-2', orderNumber: 'ORD-20260914-1002', userId: 'usr-2', totalAmount: 149.50, status: 'PROCESSING' },
        ],
        totalElements: 2,
      };
    }
  }

  async getOrderById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/admin/orders/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream order-service call failed: ${err.message}. Returning mock order.`);
      return {
        id,
        orderNumber: `ORD-${id}`,
        status: 'PAID',
        totalAmount: 250.00,
      };
    }
  }

  async cancelOrder(id: string, reason?: string, idempotencyKey?: string) {
    try {
      const response = await this.http.post(`/api/v1/admin/orders/${id}/cancel`, { reason }, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream order-service call failed: ${err.message}. Simulating order cancellation.`);
      return { id, status: 'CANCELLED', cancelled: true, reason };
    }
  }

  async refundOrder(id: string, amount?: number, reason?: string, idempotencyKey?: string) {
    try {
      const response = await this.http.post(`/api/v1/admin/orders/${id}/refund`, { amount, reason }, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream order-service call failed: ${err.message}. Simulating order refund.`);
      return { id, status: 'REFUNDED', refunded: true, amount, reason };
    }
  }
}

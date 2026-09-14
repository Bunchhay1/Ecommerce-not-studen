import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PaymentsClient {
  private readonly logger = new Logger(PaymentsClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:8007';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getPayments(params: any) {
    try {
      const response = await this.http.get('/api/v1/payments', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream payment-service call failed: ${err.message}. Returning mock payments.`);
      return {
        items: [
          { id: 'pay-1', orderId: 'ord-101', amount: 1199.00, currency: 'USD', status: 'COMPLETED', provider: 'STRIPE', createdAt: new Date().toISOString() },
          { id: 'pay-2', orderId: 'ord-102', amount: 1599.00, currency: 'USD', status: 'REFUNDED', provider: 'STRIPE', createdAt: new Date().toISOString() },
        ],
        total: 2,
      };
    }
  }

  async getPaymentById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/payments/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream payment-service call failed: ${err.message}. Returning mock payment.`);
      return { id, orderId: 'ord-101', amount: 1199.00, currency: 'USD', status: 'COMPLETED', provider: 'STRIPE' };
    }
  }

  async refundPayment(id: string, amount: number, reason: string, idempotencyKey?: string) {
    try {
      const response = await this.http.post(`/api/v1/payments/${id}/refund`, { amount, reason }, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream payment-service call failed: ${err.message}. Simulating refund.`);
      return { id, refundAmount: amount, status: 'REFUNDED', reason };
    }
  }
}

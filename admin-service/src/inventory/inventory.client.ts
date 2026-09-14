import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class InventoryClient {
  private readonly logger = new Logger(InventoryClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('INVENTORY_SERVICE_URL') || 'http://localhost:8006';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getInventory(params: any) {
    try {
      const response = await this.http.get('/api/v1/inventory', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream inventory-service call failed: ${err.message}. Returning mock inventory.`);
      return {
        items: [
          { variantId: 'var-1', sku: 'IPH17-256-BLK', availableStock: 45, reservedStock: 5 },
          { variantId: 'var-2', sku: 'MBA-M4-16-512', availableStock: 8, reservedStock: 2 },
        ],
        total: 2,
      };
    }
  }

  async getStock(variantId: string) {
    try {
      const response = await this.http.get(`/api/v1/inventory/${variantId}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream inventory-service call failed: ${err.message}. Returning mock stock.`);
      return { variantId, availableStock: 50, reservedStock: 0 };
    }
  }

  async adjustStock(variantId: string, quantity: number, reason: string, idempotencyKey?: string) {
    try {
      const response = await this.http.post(`/api/v1/inventory/${variantId}/adjust`, { quantity, reason }, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream inventory-service call failed: ${err.message}. Simulating stock adjustment.`);
      return { variantId, quantityAdjusted: quantity, reason, status: 'ADJUSTED' };
    }
  }
}

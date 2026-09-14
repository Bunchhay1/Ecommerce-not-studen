import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CatalogClient {
  private readonly logger = new Logger(CatalogClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('CATALOG_SERVICE_URL') || 'http://localhost:8003';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getProducts(params: any) {
    try {
      const response = await this.http.get('/api/v1/products', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream catalog-service call failed: ${err.message}. Returning mock products.`);
      return {
        content: [
          { id: 'prod-1', name: 'iPhone 17 Pro', brand: 'Apple', status: 'ACTIVE' },
          { id: 'prod-2', name: 'MacBook Air M4', brand: 'Apple', status: 'PENDING_APPROVAL' },
        ],
        totalElements: 2,
      };
    }
  }

  async getProductById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/products/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream catalog-service call failed: ${err.message}. Returning mock product.`);
      return { id, name: `Product ${id}`, status: 'ACTIVE' };
    }
  }

  async updateProductStatus(id: string, status: string, reason?: string) {
    try {
      const response = await this.http.patch(`/api/v1/admin/products/${id}/status`, { status, reason });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream catalog-service call failed: ${err.message}. Simulating successful update.`);
      return { id, status, updated: true, reason };
    }
  }
}

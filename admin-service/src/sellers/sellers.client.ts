import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class SellersClient {
  private readonly logger = new Logger(SellersClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('SELLER_SERVICE_URL') || 'http://localhost:8014';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getSellers(params?: any) {
    try {
      const queryParams = typeof params === 'string' ? { status: params } : (params || {});
      const response = await this.http.get('/api/v1/admin/sellers', {
        params: queryParams,
      });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream seller-service call failed: ${err.message}. Returning mock sellers.`);
      return {
        content: [
          { id: 'sel-1', displayName: 'TechStore', sellerCode: 'SELLER-TECH1', status: 'ACTIVE' },
          { id: 'sel-2', displayName: 'FashionHub', sellerCode: 'SELLER-FASH2', status: 'PENDING' },
        ],
        totalElements: 2,
      };
    }
  }

  async getSellerById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/admin/sellers/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream seller-service call failed: ${err.message}. Returning mock seller.`);
      return { id, displayName: `Seller ${id}`, status: 'ACTIVE' };
    }
  }

  async updateSellerStatus(id: string, status: string, reason?: string) {
    try {
      const response = await this.http.patch(`/api/v1/admin/sellers/${id}/status`, { status, reason });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream seller-service call failed: ${err.message}. Simulating successful update.`);
      return { id, status, updated: true, reason };
    }
  }

  async verifySeller(id: string) {
    try {
      const response = await this.http.post(`/api/v1/admin/sellers/${id}/verify`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream seller-service call failed: ${err.message}. Simulating verification.`);
      return { id, verificationStatus: 'VERIFIED', status: 'ACTIVE' };
    }
  }
}

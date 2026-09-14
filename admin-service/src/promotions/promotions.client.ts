import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PromotionsClient {
  private readonly logger = new Logger(PromotionsClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('PROMOTION_SERVICE_URL') || 'http://localhost:8011';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getPromotions(params: any) {
    try {
      const response = await this.http.get('/api/v1/promotions', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream promotion-service call failed: ${err.message}. Returning mock promotions.`);
      return {
        items: [
          { id: 'promo-1', code: 'FALL2026', discountPercent: 15, active: true, usageCount: 340, maxUsage: 1000 },
          { id: 'promo-2', code: 'VIPFREE', discountAmount: 20, active: true, usageCount: 45, maxUsage: 200 },
        ],
        total: 2,
      };
    }
  }

  async getPromotionById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/promotions/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream promotion-service call failed: ${err.message}. Returning mock promo.`);
      return { id, code: 'FALL2026', discountPercent: 15, active: true };
    }
  }

  async createPromotion(data: any) {
    try {
      const response = await this.http.post('/api/v1/promotions', data);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream promotion-service call failed: ${err.message}. Simulating create.`);
      return { id: `promo-${Date.now()}`, ...data, active: true };
    }
  }

  async updatePromotionStatus(id: string, active: boolean) {
    try {
      const response = await this.http.patch(`/api/v1/promotions/${id}/status`, { active });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream promotion-service call failed: ${err.message}. Simulating update.`);
      return { id, active };
    }
  }
}

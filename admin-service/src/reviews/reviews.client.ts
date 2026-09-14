import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ReviewsClient {
  private readonly logger = new Logger(ReviewsClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('REVIEW_SERVICE_URL') || 'http://localhost:8012';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getReviews(params: any) {
    try {
      const response = await this.http.get('/api/v1/reviews', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream review-service call failed: ${err.message}. Returning mock reviews.`);
      return {
        items: [
          { id: 'rev-1', productId: 'prod-1', userId: 'usr-1', rating: 5, comment: 'Exceptional build quality!', status: 'APPROVED', flagged: false },
          { id: 'rev-2', productId: 'prod-2', userId: 'usr-2', rating: 1, comment: 'Spam link: http://spam.xyz', status: 'FLAGGED', flagged: true },
        ],
        total: 2,
      };
    }
  }

  async getReviewById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/reviews/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream review-service call failed: ${err.message}. Returning mock review.`);
      return { id, productId: 'prod-2', userId: 'usr-2', rating: 1, comment: 'Spam review', status: 'FLAGGED' };
    }
  }

  async updateReviewStatus(id: string, status: string, reason?: string) {
    try {
      const response = await this.http.patch(`/api/v1/reviews/${id}/status`, { status, reason });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream review-service call failed: ${err.message}. Simulating status update.`);
      return { id, status, reason };
    }
  }

  async deleteReview(id: string) {
    try {
      const response = await this.http.delete(`/api/v1/reviews/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream review-service call failed: ${err.message}. Simulating delete.`);
      return { id, deleted: true };
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class UsersClient {
  private readonly logger = new Logger(UsersClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('USER_SERVICE_URL') || 'http://localhost:8002';
    this.http = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async getUsers(params: any) {
    try {
      const response = await this.http.get('/api/v1/users', { params });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream user-service call failed: ${err.message}. Returning mock response.`);
      return {
        users: [
          { id: 'usr-1', email: 'alice@example.com', name: 'Alice Smith', status: 'ACTIVE' },
          { id: 'usr-2', email: 'bob@example.com', name: 'Bob Jones', status: 'ACTIVE' },
        ],
        total: 2,
      };
    }
  }

  async getUserById(id: string) {
    try {
      const response = await this.http.get(`/api/v1/users/${id}`);
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream user-service call failed: ${err.message}. Returning mock user.`);
      return { id, email: `${id}@example.com`, name: `User ${id}`, status: 'ACTIVE' };
    }
  }

  async updateUserStatus(id: string, status: string, reason?: string) {
    try {
      const response = await this.http.patch(`/api/v1/users/${id}/status`, { status, reason });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Downstream user-service call failed: ${err.message}. Simulating successful update.`);
      return { id, status, updated: true, reason };
    }
  }
}

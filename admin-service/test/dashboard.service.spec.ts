import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { OrdersClient } from '../src/orders/orders.client';
import { UsersClient } from '../src/users/users.client';
import { SellersClient } from '../src/sellers/sellers.client';
import { CatalogClient } from '../src/catalog/catalog.client';
import { InventoryClient } from '../src/inventory/inventory.client';
import { PaymentsClient } from '../src/payments/payments.client';
import { ReviewsClient } from '../src/reviews/reviews.client';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: { dashboardDailyAggregate: { findMany: jest.fn().mockResolvedValue([]) } } },
        { provide: RedisService, useValue: mockRedis },
        { provide: OrdersClient, useValue: { getOrders: jest.fn().mockResolvedValue({ total: 100, items: [] }) } },
        { provide: UsersClient, useValue: { getUsers: jest.fn().mockResolvedValue({ total: 500 }) } },
        { provide: SellersClient, useValue: { getSellers: jest.fn().mockResolvedValue({ total: 30, items: [] }) } },
        { provide: CatalogClient, useValue: { getProducts: jest.fn().mockResolvedValue({ total: 250 }) } },
        { provide: InventoryClient, useValue: { getInventory: jest.fn().mockResolvedValue({ items: [] }) } },
        { provide: PaymentsClient, useValue: { getPayments: jest.fn().mockResolvedValue({ total: 95, items: [] }) } },
        { provide: ReviewsClient, useValue: { getReviews: jest.fn().mockResolvedValue({ items: [] }) } },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should compute aggregated summary from downstream clients', async () => {
    const summary = await service.getDashboardSummary();
    expect(summary.metrics.totalOrders).toBe(100);
    expect(summary.metrics.totalUsers).toBe(500);
    expect(summary.metrics.totalSellers).toBe(30);
    expect(mockRedis.set).toHaveBeenCalledWith('admin:dashboard:summary', expect.any(Object), 60);
  });

  it('should return cached summary if present in Redis', async () => {
    const cachedData = {
      metrics: { totalOrders: 999, totalRevenue: 100000 },
      timestamp: '2026-09-14T00:00:00.000Z',
    };
    mockRedis.get.mockResolvedValue(cachedData);

    const result = await service.getDashboardSummary();
    expect(result.metrics.totalOrders).toBe(999);
  });

  it('should return daily trends', async () => {
    const trends = await service.getTrends(5);
    expect(trends.length).toBe(5);
    expect(trends[0]).toHaveProperty('date');
    expect(trends[0]).toHaveProperty('revenue');
  });
});

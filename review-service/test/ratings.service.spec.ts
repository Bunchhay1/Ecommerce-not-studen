import { Test, TestingModule } from '@nestjs/testing';
import { RatingsService } from '../src/ratings/ratings.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      productRatingSummary: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  it('should create new summary when first review is applied', async () => {
    prisma.productRatingSummary.findUnique.mockResolvedValue(null);
    prisma.productRatingSummary.create.mockImplementation(({ data }) => Promise.resolve(data));

    const result = await service.applyNewRating('prod-1', 5);
    expect(result.totalReviews).toBe(1);
    expect(result.ratingSum).toBe(5);
    expect(result.averageRating).toBe(5.0);
    expect(result.rating5Count).toBe(1);
    expect(redis.del).toHaveBeenCalledWith('rating:summary:prod-1');
  });

  it('should update existing summary when additional review is added', async () => {
    prisma.productRatingSummary.findUnique.mockResolvedValue({
      productId: 'prod-1',
      totalReviews: 1,
      ratingSum: 5,
      averageRating: 5.0,
      rating1Count: 0,
      rating2Count: 0,
      rating3Count: 0,
      rating4Count: 0,
      rating5Count: 1,
    });
    prisma.productRatingSummary.update.mockImplementation(({ data }) => Promise.resolve({
      productId: 'prod-1',
      ...data,
    }));

    const result = await service.applyNewRating('prod-1', 4);
    expect(result.totalReviews).toBe(2);
    expect(result.ratingSum).toBe(9);
    expect(result.averageRating).toBe(4.5);
  });

  it('should recalculate average and counts when customer updates rating from 4 to 5', async () => {
    prisma.productRatingSummary.findUnique.mockResolvedValue({
      productId: 'prod-1',
      totalReviews: 2,
      ratingSum: 9,
      averageRating: 4.5,
      rating4Count: 1,
      rating5Count: 1,
    });
    prisma.productRatingSummary.update.mockImplementation(({ data }) => Promise.resolve({
      productId: 'prod-1',
      totalReviews: 2,
      ratingSum: data.ratingSum,
      averageRating: data.averageRating,
    }));

    const result = await service.applyRatingChange('prod-1', 4, 5);
    expect(result.ratingSum).toBe(10);
    expect(result.averageRating).toBe(5.0);
  });
});

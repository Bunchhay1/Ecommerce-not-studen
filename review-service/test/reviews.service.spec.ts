import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ReviewsService } from '../src/reviews/reviews.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RatingsService } from '../src/ratings/ratings.service';
import { OutboxService } from '../src/outbox/outbox.service';
import { ReviewStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;
  let ratingsService: any;
  let outboxService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      review: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      reviewPurchaseEligibility: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    ratingsService = {
      applyNewRating: jest.fn().mockResolvedValue({ averageRating: 5.0, totalReviews: 1 }),
      applyRatingChange: jest.fn().mockResolvedValue({ averageRating: 4.5, totalReviews: 2 }),
      removeRating: jest.fn().mockResolvedValue({ averageRating: 0.0, totalReviews: 0 }),
      getRatingSummary: jest.fn().mockResolvedValue({ averageRating: 5.0, totalReviews: 1 }),
    };

    outboxService = {
      createEvent: jest.fn().mockResolvedValue({ id: 'event-1' }),
    };

    configService = {
      get: jest.fn((key: string, defVal?: any) => {
        if (key === 'review.autoPublishVerified') return true;
        return defVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RatingsService, useValue: ratingsService },
        { provide: OutboxService, useValue: outboxService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should prevent duplicate review submission for the same purchase item', async () => {
    prisma.review.findFirst.mockResolvedValue({ id: 'existing-rev' });

    await expect(
      service.createReview('user-1', {
        productId: 'prod-1',
        orderItemId: 'item-101',
        rating: 5,
        title: 'Great',
        content: 'Love it',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create and auto-publish review if customer is verified purchaser', async () => {
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.reviewPurchaseEligibility.findFirst.mockResolvedValue({ eligible: true });
    prisma.review.create.mockImplementation(({ data }) => Promise.resolve({
      id: 'rev-new',
      ...data,
    }));

    const result = await service.createReview('user-1', {
      productId: 'prod-1',
      orderItemId: 'item-101',
      rating: 5,
      title: 'Great laptop',
      content: 'Super fast and quiet.',
    });

    expect(result.verifiedPurchase).toBe(true);
    expect(result.status).toBe(ReviewStatus.PUBLISHED);
    expect(ratingsService.applyNewRating).toHaveBeenCalledWith('prod-1', 5, expect.anything());
    expect(outboxService.createEvent).toHaveBeenCalled();
  });

  it('should reject unauthorized update of another customer review', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'rev-1',
      userId: 'user-owner',
      rating: 5,
      title: 'Original',
      content: 'Original',
      status: ReviewStatus.PUBLISHED,
    });

    await expect(
      service.updateReview('rev-1', 'user-intruder', { rating: 1 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should soft-delete review and decrement rating summary', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'rev-1',
      userId: 'user-owner',
      productId: 'prod-1',
      rating: 5,
      status: ReviewStatus.PUBLISHED,
    });
    prisma.review.update.mockResolvedValue({
      id: 'rev-1',
      status: ReviewStatus.DELETED,
    });

    const deleted = await service.deleteReview('rev-1', 'user-owner', false);
    expect(deleted.status).toBe(ReviewStatus.DELETED);
    expect(ratingsService.removeRating).toHaveBeenCalledWith('prod-1', 5, expect.anything());
  });
});

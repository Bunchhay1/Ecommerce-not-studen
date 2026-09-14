import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from '../src/moderation/moderation.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RatingsService } from '../src/ratings/ratings.service';
import { OutboxService } from '../src/outbox/outbox.service';
import { ReviewStatus } from '@prisma/client';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: any;
  let ratingsService: any;
  let outboxService: any;

  beforeEach(async () => {
    prisma = {
      review: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      reviewReport: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    ratingsService = {
      applyNewRating: jest.fn().mockResolvedValue({ averageRating: 5.0, totalReviews: 1 }),
      removeRating: jest.fn().mockResolvedValue({ averageRating: 0.0, totalReviews: 0 }),
    };

    outboxService = {
      createEvent: jest.fn().mockResolvedValue({ id: 'event-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: prisma },
        { provide: RatingsService, useValue: ratingsService },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  it('should approve pending review to PUBLISHED and apply rating summary', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'rev-pending',
      productId: 'prod-1',
      rating: 5,
      status: ReviewStatus.PENDING,
    });
    prisma.review.update.mockResolvedValue({
      id: 'rev-pending',
      status: ReviewStatus.PUBLISHED,
    });

    const result = await service.updateReviewStatus('rev-pending', ReviewStatus.PUBLISHED);
    expect(result.status).toBe(ReviewStatus.PUBLISHED);
    expect(ratingsService.applyNewRating).toHaveBeenCalledWith('prod-1', 5, expect.anything());
    expect(outboxService.createEvent).toHaveBeenCalled();
  });

  it('should hide published review and remove rating from summary', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'rev-pub',
      productId: 'prod-1',
      rating: 4,
      status: ReviewStatus.PUBLISHED,
    });
    prisma.review.update.mockResolvedValue({
      id: 'rev-pub',
      status: ReviewStatus.HIDDEN,
    });

    const result = await service.updateReviewStatus('rev-pub', ReviewStatus.HIDDEN);
    expect(result.status).toBe(ReviewStatus.HIDDEN);
    expect(ratingsService.removeRating).toHaveBeenCalledWith('prod-1', 4, expect.anything());
  });
});

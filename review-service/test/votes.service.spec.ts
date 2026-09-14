import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from '../src/votes/votes.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { OutboxService } from '../src/outbox/outbox.service';
import { BadRequestException } from '@nestjs/common';
import { VoteType, ReviewStatus } from '@prisma/client';

describe('VotesService', () => {
  let service: VotesService;
  let prisma: any;
  let outboxService: any;

  beforeEach(async () => {
    prisma = {
      review: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      reviewVote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    outboxService = {
      createEvent: jest.fn().mockResolvedValue({ id: 'event-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
  });

  it('should record helpful vote and increment review helpfulCount', async () => {
    prisma.review.findUnique.mockResolvedValue({ id: 'rev-1', status: ReviewStatus.PUBLISHED });
    prisma.reviewVote.findUnique.mockResolvedValue(null);
    prisma.review.update.mockResolvedValue({ id: 'rev-1', helpfulCount: 1 });

    const result = await service.voteHelpful('rev-1', 'user-1');
    expect(result.helpfulCount).toBe(1);
    expect(prisma.reviewVote.create).toHaveBeenCalled();
  });

  it('should prevent duplicate helpful vote from the same user', async () => {
    prisma.review.findUnique.mockResolvedValue({ id: 'rev-1', status: ReviewStatus.PUBLISHED });
    prisma.reviewVote.findUnique.mockResolvedValue({
      id: 'vote-1',
      vote: VoteType.HELPFUL,
    });

    await expect(service.voteHelpful('rev-1', 'user-1')).rejects.toThrow(BadRequestException);
  });
});

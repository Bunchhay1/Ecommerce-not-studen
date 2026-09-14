import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { VoteType, ReviewStatus } from '@prisma/client';
import { ErrorCodes } from '../common/error-codes';
import { ReviewEventType } from '../kafka/events';

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  async voteHelpful(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.status === ReviewStatus.DELETED) {
      throw new NotFoundException({
        errorCode: ErrorCodes.REVIEW_NOT_FOUND,
        message: 'Review not found',
      });
    }

    const existingVote = await this.prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: { reviewId, userId },
      },
    });

    if (existingVote) {
      if (existingVote.vote === VoteType.HELPFUL) {
        throw new BadRequestException({
          errorCode: ErrorCodes.ALREADY_VOTED,
          message: 'User has already marked this review as helpful',
        });
      }
      // Update vote from NOT_HELPFUL to HELPFUL
      return this.prisma.$transaction(async (tx) => {
        await tx.reviewVote.update({
          where: { id: existingVote.id },
          data: { vote: VoteType.HELPFUL },
        });

        const updatedReview = await tx.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { increment: 1 } },
        });

        await this.outboxService.createEvent(
          'ReviewVote',
          reviewId,
          ReviewEventType.ReviewHelpful,
          { reviewId, userId, helpfulCount: updatedReview.helpfulCount },
          tx,
        );

        return { reviewId, helpfulCount: updatedReview.helpfulCount };
      });
    }

    // New vote
    return this.prisma.$transaction(async (tx) => {
      await tx.reviewVote.create({
        data: {
          reviewId,
          userId,
          vote: VoteType.HELPFUL,
        },
      });

      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      });

      await this.outboxService.createEvent(
        'ReviewVote',
        reviewId,
        ReviewEventType.ReviewHelpful,
        { reviewId, userId, helpfulCount: updatedReview.helpfulCount },
        tx,
      );

      return { reviewId, helpfulCount: updatedReview.helpfulCount };
    });
  }

  async removeHelpfulVote(reviewId: string, userId: string) {
    const existingVote = await this.prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: { reviewId, userId },
      },
    });

    if (!existingVote || existingVote.vote !== VoteType.HELPFUL) {
      return { reviewId, message: 'No helpful vote found to remove' };
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.reviewVote.delete({
        where: { id: existingVote.id },
      });

      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
      });

      return { reviewId, helpfulCount: updatedReview.helpfulCount };
    });
  }
}

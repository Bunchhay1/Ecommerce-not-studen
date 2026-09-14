import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { OutboxService } from '../outbox/outbox.service';
import { ReviewStatus, ReportStatus } from '@prisma/client';
import { ErrorCodes } from '../common/error-codes';
import { ReviewEventType } from '../kafka/events';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly outboxService: OutboxService,
  ) {}

  async listReviews(status?: ReviewStatus, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { media: true },
      }),
    ]);

    return {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      reviews,
    };
  }

  async getReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { media: true, reports: true, votes: true },
    });
    if (!review) {
      throw new NotFoundException({
        errorCode: ErrorCodes.REVIEW_NOT_FOUND,
        message: 'Review not found',
      });
    }
    return review;
  }

  async updateReviewStatus(id: string, newStatus: ReviewStatus) {
    const review = await this.getReview(id);
    const oldStatus = review.status;

    if (oldStatus === newStatus) {
      return review;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt: newStatus === ReviewStatus.PUBLISHED ? new Date() : review.publishedAt,
        },
      });

      // Rating adjustments
      if (oldStatus !== ReviewStatus.PUBLISHED && newStatus === ReviewStatus.PUBLISHED) {
        const updatedSummary = await this.ratingsService.applyNewRating(review.productId, review.rating, tx);
        await this.outboxService.createEvent(
          'RatingSummary',
          review.productId,
          ReviewEventType.RatingUpdated,
          {
            productId: review.productId,
            averageRating: updatedSummary.averageRating,
            totalReviews: updatedSummary.totalReviews,
          },
          tx,
        );
      } else if (oldStatus === ReviewStatus.PUBLISHED && newStatus !== ReviewStatus.PUBLISHED) {
        const updatedSummary = await this.ratingsService.removeRating(review.productId, review.rating, tx);
        if (updatedSummary) {
          await this.outboxService.createEvent(
            'RatingSummary',
            review.productId,
            ReviewEventType.RatingUpdated,
            {
              productId: review.productId,
              averageRating: updatedSummary.averageRating,
              totalReviews: updatedSummary.totalReviews,
            },
            tx,
          );
        }
      }

      // Outbox Event
      const eventType = newStatus === ReviewStatus.PUBLISHED
        ? ReviewEventType.ReviewPublished
        : (newStatus === ReviewStatus.HIDDEN ? ReviewEventType.ReviewHidden : ReviewEventType.ReviewUpdated);

      await this.outboxService.createEvent(
        'Review',
        review.id,
        eventType,
        {
          reviewId: review.id,
          productId: review.productId,
          oldStatus,
          newStatus,
        },
        tx,
      );

      return updated;
    });
  }

  async listReports(status?: ReportStatus, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};

    const [total, reports] = await Promise.all([
      this.prisma.reviewReport.count({ where }),
      this.prisma.reviewReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { review: true },
      }),
    ]);

    return {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      reports,
    };
  }

  async updateReportStatus(id: string, newStatus: ReportStatus) {
    const report = await this.prisma.reviewReport.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.reviewReport.update({
      where: { id },
      data: {
        status: newStatus,
        resolvedAt: newStatus !== ReportStatus.PENDING ? new Date() : null,
      },
    });
  }
}

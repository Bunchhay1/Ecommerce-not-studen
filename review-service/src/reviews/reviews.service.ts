import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { OutboxService } from '../outbox/outbox.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewStatus, Review } from '@prisma/client';
import { ErrorCodes } from '../common/error-codes';
import { ReviewEventType } from '../kafka/events';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    // 1. Check duplicate review
    const duplicateWhere: any = {
      userId,
      productId: dto.productId,
      status: { not: ReviewStatus.DELETED },
    };

    if (dto.orderItemId) {
      duplicateWhere.orderItemId = dto.orderItemId;
    } else if (dto.orderId) {
      duplicateWhere.orderId = dto.orderId;
    }

    const existing = await this.prisma.review.findFirst({ where: duplicateWhere });
    if (existing) {
      throw new BadRequestException({
        errorCode: ErrorCodes.REVIEW_ALREADY_EXISTS,
        message: 'A review for this purchased item already exists from this customer',
      });
    }

    // 2. Verified purchase check against purchase eligibility
    let isVerified = false;
    if (dto.orderItemId || dto.orderId) {
      const eligibility = await this.prisma.reviewPurchaseEligibility.findFirst({
        where: {
          userId,
          productId: dto.productId,
          ...(dto.orderItemId ? { orderItemId: dto.orderItemId } : {}),
          ...(dto.orderId ? { orderId: dto.orderId } : {}),
        },
      });
      isVerified = !!eligibility?.eligible;
    }

    // 3. Status determination: auto-publish verified or default to PENDING
    const autoPublish = this.configService.get<boolean>('review.autoPublishVerified', true);
    const initialStatus = isVerified && autoPublish ? ReviewStatus.PUBLISHED : ReviewStatus.PENDING;
    const publishedAt = initialStatus === ReviewStatus.PUBLISHED ? new Date() : null;

    // 4. Persistence in transaction
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          productId: dto.productId,
          variantId: dto.variantId,
          userId,
          orderId: dto.orderId,
          orderItemId: dto.orderItemId,
          rating: dto.rating,
          title: dto.title,
          content: dto.content,
          status: initialStatus,
          verifiedPurchase: isVerified,
          publishedAt,
          media: dto.media && dto.media.length > 0 ? {
            create: dto.media.map((m, idx) => ({
              mediaType: m.mediaType,
              url: m.url,
              storageKey: m.storageKey,
              sortOrder: idx,
            })),
          } : undefined,
        },
        include: { media: true },
      });

      // Outbox: ReviewCreated
      await this.outboxService.createEvent(
        'Review',
        review.id,
        ReviewEventType.ReviewCreated,
        {
          reviewId: review.id,
          productId: review.productId,
          userId: review.userId,
          rating: review.rating,
          status: review.status,
          verifiedPurchase: review.verifiedPurchase,
        },
        tx,
      );

      // If auto-published, apply rating and emit RatingUpdated
      if (initialStatus === ReviewStatus.PUBLISHED) {
        const updatedSummary = await this.ratingsService.applyNewRating(dto.productId, dto.rating, tx);
        await this.outboxService.createEvent(
          'RatingSummary',
          dto.productId,
          ReviewEventType.RatingUpdated,
          {
            productId: dto.productId,
            averageRating: updatedSummary.averageRating,
            totalReviews: updatedSummary.totalReviews,
          },
          tx,
        );
      }

      return review;
    });
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!review || review.status === ReviewStatus.DELETED) {
      throw new NotFoundException({
        errorCode: ErrorCodes.REVIEW_NOT_FOUND,
        message: `Review with ID '${id}' not found`,
      });
    }

    return review;
  }

  async updateReview(id: string, userId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.getReviewById(id);

    if (review.userId !== userId) {
      throw new ForbiddenException({
        errorCode: ErrorCodes.UNAUTHORIZED_REVIEW_ACCESS,
        message: 'You can only edit your own reviews',
      });
    }

    const oldRating = review.rating;
    const newRating = dto.rating ?? oldRating;
    const ratingChanged = dto.rating !== undefined && dto.rating !== oldRating;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          rating: newRating,
          title: dto.title ?? review.title,
          content: dto.content ?? review.content,
        },
        include: { media: true },
      });

      if (ratingChanged && review.status === ReviewStatus.PUBLISHED) {
        const updatedSummary = await this.ratingsService.applyRatingChange(
          review.productId,
          oldRating,
          newRating,
          tx,
        );
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

      await this.outboxService.createEvent(
        'Review',
        updated.id,
        ReviewEventType.ReviewUpdated,
        {
          reviewId: updated.id,
          productId: updated.productId,
          rating: updated.rating,
        },
        tx,
      );

      return updated;
    });
  }

  async deleteReview(id: string, userId: string, isAdmin = false): Promise<Review> {
    const review = await this.getReviewById(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException({
        errorCode: ErrorCodes.UNAUTHORIZED_REVIEW_ACCESS,
        message: 'You can only delete your own reviews',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.review.update({
        where: { id },
        data: { status: ReviewStatus.DELETED },
      });

      if (review.status === ReviewStatus.PUBLISHED) {
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

      await this.outboxService.createEvent(
        'Review',
        review.id,
        ReviewEventType.ReviewDeleted,
        { reviewId: review.id, productId: review.productId },
        tx,
      );

      return deleted;
    });
  }

  async getProductReviews(productId: string, query: ReviewQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      productId,
      status: ReviewStatus.PUBLISHED,
    };

    if (query.rating) {
      where.rating = query.rating;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (query.sortBy === 'lowest') {
      orderBy = { rating: 'asc' };
    } else if (query.sortBy === 'helpful') {
      orderBy = { helpfulCount: 'desc' };
    }

    const [total, reviews, ratingSummary] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { media: true },
      }),
      this.ratingsService.getRatingSummary(productId),
    ]);

    return {
      productId,
      ratingSummary: {
        average: ratingSummary.averageRating,
        totalReviews: ratingSummary.totalReviews,
        distribution: {
          1: ratingSummary.rating1Count,
          2: ratingSummary.rating2Count,
          3: ratingSummary.rating3Count,
          4: ratingSummary.rating4Count,
          5: ratingSummary.rating5Count,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      reviews: reviews.map((r) => ({
        reviewId: r.id,
        productId: r.productId,
        variantId: r.variantId,
        rating: r.rating,
        title: r.title,
        content: r.content,
        verifiedPurchase: r.verifiedPurchase,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
        media: r.media.map((m) => ({
          mediaType: m.mediaType,
          url: m.url,
        })),
      })),
    };
  }
}

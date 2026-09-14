import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ProductRatingSummary } from '@prisma/client';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getCacheKey(productId: string): string {
    return `rating:summary:${productId}`;
  }

  async getRatingSummary(productId: string): Promise<ProductRatingSummary> {
    const cacheKey = this.getCacheKey(productId);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }

    let summary = await this.prisma.productRatingSummary.findUnique({
      where: { productId },
    });

    if (!summary) {
      summary = {
        productId,
        totalReviews: 0,
        ratingSum: 0,
        averageRating: 0.0,
        rating1Count: 0,
        rating2Count: 0,
        rating3Count: 0,
        rating4Count: 0,
        rating5Count: 0,
        updatedAt: new Date(),
      };
    }

    await this.redis.set(cacheKey, JSON.stringify(summary), 600);
    return summary;
  }

  async applyNewRating(productId: string, rating: number, txClient?: any): Promise<ProductRatingSummary> {
    const client = txClient || this.prisma;

    const existing = await client.productRatingSummary.findUnique({
      where: { productId },
    });

    const ratingKey = `rating${rating}Count` as keyof ProductRatingSummary;

    let updated: ProductRatingSummary;

    if (!existing) {
      const data: any = {
        productId,
        totalReviews: 1,
        ratingSum: rating,
        averageRating: Number(rating.toFixed(2)),
        rating1Count: 0,
        rating2Count: 0,
        rating3Count: 0,
        rating4Count: 0,
        rating5Count: 0,
      };
      data[ratingKey] = 1;

      updated = await client.productRatingSummary.create({ data });
    } else {
      const newTotal = existing.totalReviews + 1;
      const newSum = existing.ratingSum + rating;
      const newAvg = Number((newSum / newTotal).toFixed(2));

      const updateData: any = {
        totalReviews: newTotal,
        ratingSum: newSum,
        averageRating: newAvg,
        [ratingKey]: { increment: 1 },
      };

      updated = await client.productRatingSummary.update({
        where: { productId },
        data: updateData,
      });
    }

    await this.redis.del(this.getCacheKey(productId));
    return updated;
  }

  async applyRatingChange(
    productId: string,
    oldRating: number,
    newRating: number,
    txClient?: any,
  ): Promise<ProductRatingSummary> {
    const client = txClient || this.prisma;
    const existing = await client.productRatingSummary.findUnique({ where: { productId } });

    if (!existing) {
      return this.applyNewRating(productId, newRating, txClient);
    }

    const newSum = existing.ratingSum - oldRating + newRating;
    const newAvg = existing.totalReviews > 0 ? Number((newSum / existing.totalReviews).toFixed(2)) : 0.0;

    const oldKey = `rating${oldRating}Count`;
    const newKey = `rating${newRating}Count`;

    const updateData: any = {
      ratingSum: newSum,
      averageRating: newAvg,
      [oldKey]: { decrement: 1 },
      [newKey]: { increment: 1 },
    };

    const updated = await client.productRatingSummary.update({
      where: { productId },
      data: updateData,
    });

    await this.redis.del(this.getCacheKey(productId));
    return updated;
  }

  async removeRating(productId: string, rating: number, txClient?: any): Promise<ProductRatingSummary | null> {
    const client = txClient || this.prisma;
    const existing = await client.productRatingSummary.findUnique({ where: { productId } });
    if (!existing) return null;

    const newTotal = Math.max(0, existing.totalReviews - 1);
    const newSum = Math.max(0, existing.ratingSum - rating);
    const newAvg = newTotal > 0 ? Number((newSum / newTotal).toFixed(2)) : 0.0;
    const key = `rating${rating}Count`;

    const updateData: any = {
      totalReviews: newTotal,
      ratingSum: newSum,
      averageRating: newAvg,
      [key]: { decrement: 1 },
    };

    const updated = await client.productRatingSummary.update({
      where: { productId },
      data: updateData,
    });

    await this.redis.del(this.getCacheKey(productId));
    return updated;
  }
}

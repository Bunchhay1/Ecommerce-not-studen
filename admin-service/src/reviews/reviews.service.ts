import { Injectable } from '@nestjs/common';
import { ReviewsClient } from './reviews.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsClient: ReviewsClient,
    private readonly auditService: AuditService,
  ) {}

  async getReviews(params: any) {
    return this.reviewsClient.getReviews(params);
  }

  async getReviewById(id: string) {
    return this.reviewsClient.getReviewById(id);
  }

  async updateReviewStatus(
    id: string,
    status: string,
    reason: string,
    admin: AdminUserPayload,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.reviewsClient.getReviewById(id);
    const result = await this.reviewsClient.updateReviewStatus(id, status, reason);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: status === 'APPROVED' ? 'REVIEW_MODERATED' : 'REVIEW_REJECTED',
      resourceType: 'REVIEW',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason,
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async deleteReview(
    id: string,
    reason: string,
    admin: AdminUserPayload,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.reviewsClient.getReviewById(id);
    const result = await this.reviewsClient.deleteReview(id);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'REVIEW_DELETED',
      resourceType: 'REVIEW',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason,
      ipAddress: ip,
      userAgent,
    });

    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { PromotionsClient } from './promotions.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly promotionsClient: PromotionsClient,
    private readonly auditService: AuditService,
  ) {}

  async getPromotions(params: any) {
    return this.promotionsClient.getPromotions(params);
  }

  async getPromotionById(id: string) {
    return this.promotionsClient.getPromotionById(id);
  }

  async createPromotion(
    data: any,
    admin: AdminUserPayload,
    ip?: string,
    userAgent?: string,
  ) {
    const result = await this.promotionsClient.createPromotion(data);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'PROMOTION_CREATED',
      resourceType: 'PROMOTION',
      resourceId: result.id,
      newValue: result,
      reason: `Promotion code ${data.code} created`,
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async updatePromotionStatus(
    id: string,
    active: boolean,
    reason: string,
    admin: AdminUserPayload,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.promotionsClient.getPromotionById(id);
    const result = await this.promotionsClient.updatePromotionStatus(id, active);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: active ? 'PROMOTION_ACTIVATED' : 'PROMOTION_DEACTIVATED',
      resourceType: 'PROMOTION',
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

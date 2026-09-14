import { Injectable } from '@nestjs/common';
import { SellersClient } from './sellers.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class SellersService {
  constructor(
    private readonly sellersClient: SellersClient,
    private readonly auditService: AuditService,
  ) {}

  async getSellers(status?: string) {
    return this.sellersClient.getSellers(status);
  }

  async getSellerById(id: string) {
    return this.sellersClient.getSellerById(id);
  }

  async verifySeller(id: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.sellersClient.getSellerById(id);
    const result = await this.sellersClient.verifySeller(id);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'SELLER_VERIFIED',
      resourceType: 'SELLER',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason: 'Onboarding verification approved',
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async suspendSeller(id: string, reason: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.sellersClient.getSellerById(id);
    const result = await this.sellersClient.updateSellerStatus(id, 'SUSPENDED', reason);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'SELLER_SUSPENDED',
      resourceType: 'SELLER',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason,
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async activateSeller(id: string, reason: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.sellersClient.getSellerById(id);
    const result = await this.sellersClient.updateSellerStatus(id, 'ACTIVE', reason);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'SELLER_ACTIVATED',
      resourceType: 'SELLER',
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

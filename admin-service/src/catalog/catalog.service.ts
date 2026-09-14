import { Injectable } from '@nestjs/common';
import { CatalogClient } from './catalog.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogClient: CatalogClient,
    private readonly auditService: AuditService,
  ) {}

  async getProducts(params: any) {
    return this.catalogClient.getProducts(params);
  }

  async getProductById(id: string) {
    return this.catalogClient.getProductById(id);
  }

  async approveProduct(id: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.catalogClient.getProductById(id);
    const result = await this.catalogClient.updateProductStatus(id, 'ACTIVE');

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'PRODUCT_APPROVED',
      resourceType: 'PRODUCT',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason: 'Product moderation approved',
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async archiveProduct(id: string, reason: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.catalogClient.getProductById(id);
    const result = await this.catalogClient.updateProductStatus(id, 'ARCHIVED', reason);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'PRODUCT_ARCHIVED',
      resourceType: 'PRODUCT',
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

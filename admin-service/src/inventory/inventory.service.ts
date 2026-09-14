import { Injectable } from '@nestjs/common';
import { InventoryClient } from './inventory.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryClient: InventoryClient,
    private readonly auditService: AuditService,
  ) {}

  async getInventory(params: any) {
    return this.inventoryClient.getInventory(params);
  }

  async getStock(variantId: string) {
    return this.inventoryClient.getStock(variantId);
  }

  async adjustStock(
    variantId: string,
    quantity: number,
    reason: string,
    admin: AdminUserPayload,
    idempotencyKey?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.inventoryClient.getStock(variantId);
    const result = await this.inventoryClient.adjustStock(variantId, quantity, reason, idempotencyKey);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'INVENTORY_ADJUSTED',
      resourceType: 'INVENTORY',
      resourceId: variantId,
      oldValue: existing,
      newValue: result,
      reason: `Stock adjustment of ${quantity > 0 ? '+' + quantity : quantity}: ${reason}`,
      ipAddress: ip,
      userAgent,
      requestId: idempotencyKey,
    });

    return result;
  }
}

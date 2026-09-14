import { Injectable } from '@nestjs/common';
import { OrdersClient } from './orders.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersClient: OrdersClient,
    private readonly auditService: AuditService,
  ) {}

  async getOrders(params: any) {
    return this.ordersClient.getOrders(params);
  }

  async getOrderById(id: string) {
    return this.ordersClient.getOrderById(id);
  }

  async cancelOrder(
    id: string,
    reason: string,
    admin: AdminUserPayload,
    idempotencyKey?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.ordersClient.getOrderById(id);
    const result = await this.ordersClient.cancelOrder(id, reason, idempotencyKey);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'ORDER_CANCELLED',
      resourceType: 'ORDER',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason,
      ipAddress: ip,
      userAgent,
      requestId: idempotencyKey,
    });

    return result;
  }

  async refundOrder(
    id: string,
    amount: number,
    reason: string,
    admin: AdminUserPayload,
    idempotencyKey?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.ordersClient.getOrderById(id);
    const result = await this.ordersClient.refundOrder(id, amount, reason, idempotencyKey);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'ORDER_REFUNDED',
      resourceType: 'ORDER',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason: `Refund of $${amount}: ${reason}`,
      ipAddress: ip,
      userAgent,
      requestId: idempotencyKey,
    });

    return result;
  }
}

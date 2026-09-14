import { Injectable } from '@nestjs/common';
import { PaymentsClient } from './payments.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsClient: PaymentsClient,
    private readonly auditService: AuditService,
  ) {}

  async getPayments(params: any) {
    return this.paymentsClient.getPayments(params);
  }

  async getPaymentById(id: string) {
    return this.paymentsClient.getPaymentById(id);
  }

  async refundPayment(
    id: string,
    amount: number,
    reason: string,
    admin: AdminUserPayload,
    idempotencyKey?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.paymentsClient.getPaymentById(id);
    const result = await this.paymentsClient.refundPayment(id, amount, reason, idempotencyKey);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'PAYMENT_REFUNDED',
      resourceType: 'PAYMENT',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason: `Admin-initiated refund of $${amount}: ${reason}`,
      ipAddress: ip,
      userAgent,
      requestId: idempotencyKey,
    });

    return result;
  }
}

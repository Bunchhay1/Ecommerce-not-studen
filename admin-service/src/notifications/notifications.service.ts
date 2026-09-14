import { Injectable } from '@nestjs/common';
import { NotificationsClient } from './notifications.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsClient: NotificationsClient,
    private readonly auditService: AuditService,
  ) {}

  async getNotifications(params: any) {
    return this.notificationsClient.getNotifications(params);
  }

  async sendBroadcast(
    data: { title: string; message: string; targetGroup: string; channel: string },
    admin: AdminUserPayload,
    ip?: string,
    userAgent?: string,
  ) {
    const result = await this.notificationsClient.sendBroadcast(data);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'NOTIFICATION_BROADCAST_SENT',
      resourceType: 'NOTIFICATION',
      resourceId: result.broadcastId || 'broadcast',
      newValue: result,
      reason: `Broadcast "${data.title}" dispatched to ${data.targetGroup} via ${data.channel}`,
      ipAddress: ip,
      userAgent,
    });

    return result;
  }
}

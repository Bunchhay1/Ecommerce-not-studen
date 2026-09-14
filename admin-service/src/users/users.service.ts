import { Injectable } from '@nestjs/common';
import { UsersClient } from './users.client';
import { AuditService } from '../audit/audit.service';
import { AdminUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersClient: UsersClient,
    private readonly auditService: AuditService,
  ) {}

  async getUsers(params: any) {
    return this.usersClient.getUsers(params);
  }

  async getUserById(id: string) {
    return this.usersClient.getUserById(id);
  }

  async suspendUser(id: string, reason: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.usersClient.getUserById(id);
    const result = await this.usersClient.updateUserStatus(id, 'SUSPENDED', reason);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'USER_SUSPENDED',
      resourceType: 'USER',
      resourceId: id,
      oldValue: existing,
      newValue: result,
      reason,
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async activateUser(id: string, reason: string, admin: AdminUserPayload, ip?: string, userAgent?: string) {
    const existing = await this.usersClient.getUserById(id);
    const result = await this.usersClient.updateUserStatus(id, 'ACTIVE', reason);

    await this.auditService.logAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'USER_ACTIVATED',
      resourceType: 'USER',
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

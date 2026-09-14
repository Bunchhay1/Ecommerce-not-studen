import { Module } from '@nestjs/common';
import { NotificationsClient } from './notifications.client';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [NotificationsController],
  providers: [NotificationsClient, NotificationsService],
  exports: [NotificationsService, NotificationsClient],
})
export class NotificationsModule {}

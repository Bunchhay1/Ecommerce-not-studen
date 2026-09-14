import { Module } from '@nestjs/common';
import { PaymentsClient } from './payments.client';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [PaymentsController],
  providers: [PaymentsClient, PaymentsService],
  exports: [PaymentsService, PaymentsClient],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { PromotionsClient } from './promotions.client';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [PromotionsController],
  providers: [PromotionsClient, PromotionsService],
  exports: [PromotionsService, PromotionsClient],
})
export class PromotionsModule {}

import { Module } from '@nestjs/common';
import { InventoryClient } from './inventory.client';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [InventoryController],
  providers: [InventoryClient, InventoryService],
  exports: [InventoryService, InventoryClient],
})
export class InventoryModule {}

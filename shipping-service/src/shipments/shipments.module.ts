import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { AdminShipmentsController } from './admin-shipments.controller';
import { ShipmentsService } from './shipments.service';
import { CarriersModule } from '../carriers/carriers.module';

@Module({
  imports: [CarriersModule],
  controllers: [ShipmentsController, AdminShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}

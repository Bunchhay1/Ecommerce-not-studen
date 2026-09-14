import { Module } from '@nestjs/common';
import { OrdersClient } from './orders.client';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
  providers: [OrdersClient, OrdersService],
  exports: [OrdersService, OrdersClient],
})
export class OrdersModule {}

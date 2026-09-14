import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhookService } from './webhook.service';
import { CarriersModule } from '../carriers/carriers.module';

@Module({
  imports: [CarriersModule],
  controllers: [WebhooksController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhooksModule {}

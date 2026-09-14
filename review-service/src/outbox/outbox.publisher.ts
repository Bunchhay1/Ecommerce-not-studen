import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewEventProducer } from '../kafka/review-event.producer';
import { OutboxStatus } from './outbox-status.enum';

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer: any = null;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventProducer: ReviewEventProducer,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.processOutboxEvents();
    }, 2000);
  }

  async processOutboxEvents(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: { status: OutboxStatus.PENDING },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      for (const event of pendingEvents) {
        try {
          await this.eventProducer.publish(event.eventType, event.aggregateId, event.payload);

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.PUBLISHED,
              publishedAt: new Date(),
            },
          });
        } catch (err: any) {
          const errorMessage = err?.message || String(err);
          this.logger.error(`Failed to publish outbox event ${event.id}: ${errorMessage}`);
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.FAILED,
              errorMessage,
              retryCount: { increment: 1 },
            },
          });
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.logger.debug(`Outbox polling skipped/idle: ${errorMessage}`);
    } finally {
      this.isProcessing = false;
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

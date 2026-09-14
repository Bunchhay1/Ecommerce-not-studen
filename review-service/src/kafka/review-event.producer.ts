import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class ReviewEventProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReviewEventProducer.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string[]>('kafka.brokers', ['localhost:9102']);
    const clientId = this.configService.get<string>('kafka.clientId', 'review-service');

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: { retries: 2 },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Connected to Kafka message broker');
    } catch (err: any) {
      this.logger.warn(`Kafka connection skipped/deferred: ${err?.message || err}`);
      this.isConnected = false;
    }
  }

  async publish(eventType: string, aggregateId: string, payload: any): Promise<void> {
    const topic = this.configService.get<string>('kafka.topics.reviewEvents', 'review.events');

    if (!this.isConnected) {
      this.logger.debug(`[Mock Kafka] Publish to ${topic} [${eventType}] ID: ${aggregateId}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: aggregateId,
            value: JSON.stringify({
              eventType,
              aggregateId,
              payload,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (err: any) {
      this.logger.error(`Failed to publish event to Kafka: ${err?.message || err}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
      } catch {}
    }
  }
}

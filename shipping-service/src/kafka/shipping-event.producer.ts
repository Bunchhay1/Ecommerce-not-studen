import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class ShippingEventProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShippingEventProducer.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;
  private topic: string;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string[]>('kafka.brokers', ['localhost:9100']);
    const clientId = this.configService.get<string>('kafka.clientId', 'shipping-service');
    this.topic = this.configService.get<string>('kafka.topic', 'shipping.events');

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
      this.logger.log(`Connected to Kafka brokers for topic "${this.topic}"`);
    } catch (err) {
      this.logger.warn(`Kafka broker connection failed (mock/local mode): ${err.message}`);
    }
  }

  async publish(eventType: string, aggregateId: string, payload: any): Promise<void> {
    this.logger.log(`Publishing shipping event "${eventType}" for aggregate "${aggregateId}"`);
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: aggregateId,
            value: typeof payload === 'string' ? payload : JSON.stringify(payload),
            headers: { eventType },
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish event "${eventType}" to Kafka: ${err.message}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
    }
  }
}

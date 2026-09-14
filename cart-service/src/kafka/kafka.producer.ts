import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { CartDomainEvent, CartEventType } from './events/cart.events';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaProducer.name);
  private isConnected = false;
  private readonly topic: string;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string[]>('kafka.brokers', ['localhost:9096']);
    const clientId = this.configService.get<string>('kafka.clientId', 'cart-service');
    this.topic = this.configService.get<string>('kafka.cartEventsTopic', 'cart.events');

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 5,
      },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Connected to Apache Kafka broker.');
    } catch (err) {
      this.logger.warn(`Kafka connection deferred: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.logger.log('Disconnected from Kafka.');
    }
  }

  async publishCartEvent<T = any>(
    eventType: CartEventType,
    entityType: 'Cart' | 'CartItem',
    entityId: string,
    payload: T,
  ): Promise<void> {
    const event: CartDomainEvent<T> = {
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      timestamp: new Date().toISOString(),
      payload,
    };

    if (!this.isConnected) {
      this.logger.debug(`[MOCK KAFKA EVENT] Topic=${this.topic} Type=${eventType} ID=${entityId}`);
      return;
    }

    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: entityId,
            value: JSON.stringify(event),
          },
        ],
      });
      this.logger.log(`Published Kafka event: ${eventType} on ${this.topic}`);
    } catch (err) {
      this.logger.error(`Failed to publish event to Kafka: ${err.message}`);
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

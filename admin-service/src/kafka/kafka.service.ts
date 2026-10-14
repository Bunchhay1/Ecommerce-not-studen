import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const brokers = (this.configService.get<string>('KAFKA_BROKERS') || 'localhost:9092').split(',');
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID') || 'admin-service';
    const groupId = this.configService.get<string>('KAFKA_GROUP_ID') || 'admin-service-group';

    try {
      this.kafka = new Kafka({
        clientId,
        brokers,
        retry: { retries: 2, initialRetryTime: 300 },
      });

      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({ groupId });

      await this.producer.connect();
      await this.consumer.connect();
      await this.consumer.subscribe({ topics: ['order.events', 'seller.events', 'payment.events'], fromBeginning: false });

      this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const valueStr = message.value?.toString();
            if (!valueStr) return;
            const payload = JSON.parse(valueStr);
            this.logger.log(`Received Kafka message from ${topic} [partition ${partition}]: ${payload.eventType || topic}`);
            await this.handleIncomingEvent(topic, payload);
          } catch (err: any) {
            this.logger.error(`Error processing Kafka message on ${topic}: ${err.message}`);
          }
        },
      }).catch((err) => {
        this.logger.warn(`Kafka consumer run error: ${err.message}`);
      });

      this.isConnected = true;
      this.logger.log('Connected to Kafka brokers successfully.');
    } catch (err: any) {
      this.logger.warn(`Kafka connection unavailable: ${err.message}. Operating in fallback decoupled mode.`);
    }
  }

  private async handleIncomingEvent(topic: string, event: any) {
    const today = new Date().toISOString().slice(0, 10);

    try {
      if (topic === 'order.events' && event.eventType === 'ORDER_COMPLETED') {
        const amount = Number(event.payload?.totalAmount || 0);
        await this.incrementDailyMetric(today, 'revenue_total', amount);
        await this.incrementDailyMetric(today, 'orders_count', 1);
      } else if (topic === 'seller.events' && event.eventType === 'SELLER_REGISTERED') {
        await this.incrementDailyMetric(today, 'new_sellers', 1);
      } else if (topic === 'payment.events' && event.eventType === 'PAYMENT_FAILED') {
        await this.incrementDailyMetric(today, 'failed_payments', 1);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to update daily aggregate: ${err.message}`);
    }
  }

  private async incrementDailyMetric(date: string, metricKey: string, incrementBy: number) {
    try {
      await this.prisma.dashboardDailyAggregate.upsert({
        where: {
          date_metricKey: { date, metricKey },
        },
        create: {
          date,
          metricKey,
          metricValue: incrementBy,
        },
        update: {
          metricValue: { increment: incrementBy },
        },
      });
    } catch {
      // Best-effort in dev/offline
    }
  }

  async emitAdminEvent(topic: string, event: { eventType: string; payload: any; timestamp?: string }) {
    const message = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      source: 'admin-service',
    };

    if (this.isConnected && this.producer) {
      try {
        await this.producer.send({
          topic,
          messages: [{ value: JSON.stringify(message) }],
        });
        this.logger.log(`Emitted admin event "${event.eventType}" to topic "${topic}"`);
        return true;
      } catch (err: any) {
        this.logger.warn(`Failed to emit Kafka event: ${err.message}. Saving to outbox fallback.`);
      }
    }

    // Persist to Outbox table
    try {
      await this.prisma.outboxEvent.create({
        data: {
          aggregateType: 'ADMIN',
          aggregateId: event.payload?.resourceId || 'admin-event',
          eventType: event.eventType,
          payload: message,
        },
      });
    } catch {
      // Ignored if DB offline in test
    }
    return true;
  }

  async onModuleDestroy() {
    try {
      if (this.consumer) await this.consumer.disconnect();
      if (this.producer) await this.producer.disconnect();
    } catch (err: any) {
      this.logger.warn(`Error disconnecting Kafka: ${err.message}`);
    }
  }
}

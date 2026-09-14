import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxStatus } from './outbox-status.enum';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEvent(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: any,
    prismaClient: any = this.prisma,
  ) {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return prismaClient.outboxEvent.create({
      data: {
        aggregateType,
        aggregateId,
        eventType,
        payload: payloadStr,
        status: OutboxStatus.PENDING,
      },
    });
  }
}

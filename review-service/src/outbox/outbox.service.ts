import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxStatus } from './outbox-status.enum';

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: any,
    prismaClient?: any,
  ) {
    const client = prismaClient || this.prisma;
    return client.outboxEvent.create({
      data: {
        aggregateType,
        aggregateId,
        eventType,
        payload,
        status: OutboxStatus.PENDING,
      },
    });
  }
}

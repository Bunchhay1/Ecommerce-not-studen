import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getTrackingByShipmentId(shipmentId: string) {
    const cached = await this.redis.get<any>(`tracking:${shipmentId}`);
    if (cached) return cached;

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        trackingEvents: { orderBy: { eventTime: 'asc' } },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${shipmentId}" not found`);
    }

    const trackingData = {
      shipmentId: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      actualDeliveryDate: shipment.actualDeliveryDate,
      events: shipment.trackingEvents.map((evt) => ({
        id: evt.id,
        status: evt.status,
        location: evt.location,
        description: evt.description,
        eventTime: evt.eventTime,
      })),
    };

    await this.redis.set(`tracking:${shipmentId}`, trackingData, 300);
    return trackingData;
  }

  async getTrackingByTrackingNumber(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        trackingEvents: { orderBy: { eventTime: 'asc' } },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with tracking number "${trackingNumber}" not found`);
    }

    return this.getTrackingByShipmentId(shipment.id);
  }
}

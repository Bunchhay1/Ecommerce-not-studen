import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { RedisService } from '../redis/redis.service';
import { DhlProvider } from '../carriers/dhl.provider';
import { FedexProvider } from '../carriers/fedex.provider';
import { UpsProvider } from '../carriers/ups.provider';
import { IShippingProvider } from '../carriers/carrier.interface';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly carrierMap: Map<string, IShippingProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly redis: RedisService,
    dhlProvider: DhlProvider,
    fedexProvider: FedexProvider,
    upsProvider: UpsProvider,
  ) {
    this.carrierMap = new Map<string, IShippingProvider>([
      ['dhl', dhlProvider],
      ['fedex', fedexProvider],
      ['ups', upsProvider],
    ]);
  }

  async processCarrierWebhook(providerName: string, rawBody: string, signature?: string) {
    const provider = this.carrierMap.get(providerName.toLowerCase());
    if (!provider) {
      throw new BadRequestException(`Unsupported carrier webhook provider "${providerName}"`);
    }

    const isValid = await provider.verifyWebhook(rawBody, signature || '');
    if (!isValid) {
      this.logger.warn(`Invalid signature for ${providerName} webhook.`);
      throw new BadRequestException('Invalid carrier webhook signature');
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const eventId = payload.eventId || payload.id || `evt_${Date.now()}`;
    const eventType = payload.eventType || payload.type || 'CARRIER_STATUS_UPDATE';

    // 1. Webhook Idempotency Check
    const existing = await this.prisma.shippingWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: providerName.toUpperCase(),
          eventId,
        },
      },
    });

    if (existing && existing.processed) {
      this.logger.log(`Duplicate webhook event ${eventId} from ${providerName} ignored.`);
      return { received: true, duplicate: true };
    }

    const webhookRecord = existing || (await this.prisma.shippingWebhookEvent.create({
      data: {
        provider: providerName.toUpperCase(),
        eventId,
        eventType,
        payload: rawBody,
        processed: false,
      },
    }));

    // 2. Identify Shipment by tracking number
    const trackingNumber = payload.trackingNumber || payload.tracking_number;
    if (trackingNumber) {
      const shipment = await this.prisma.shipment.findUnique({
        where: { trackingNumber },
      });

      if (shipment) {
        let newStatus: ShipmentStatus = shipment.status;
        const normalizedType = eventType.toUpperCase();

        if (normalizedType.includes('DELIVERED')) {
          newStatus = ShipmentStatus.DELIVERED;
        } else if (normalizedType.includes('OUT_FOR_DELIVERY')) {
          newStatus = ShipmentStatus.OUT_FOR_DELIVERY;
        } else if (normalizedType.includes('TRANSIT') || normalizedType.includes('PICKED_UP')) {
          newStatus = ShipmentStatus.IN_TRANSIT;
        } else if (normalizedType.includes('FAILED')) {
          newStatus = ShipmentStatus.DELIVERY_FAILED;
        }

        if (newStatus !== shipment.status) {
          await this.prisma.$transaction(async (tx) => {
            await tx.shipment.update({
              where: { id: shipment.id },
              data: {
                status: newStatus,
                deliveredAt: newStatus === ShipmentStatus.DELIVERED ? new Date() : shipment.deliveredAt,
                trackingEvents: {
                  create: {
                    status: newStatus,
                    location: payload.location || `${providerName.toUpperCase()} Facility`,
                    description: payload.description || `Carrier status updated to ${newStatus}`,
                    eventTime: new Date(),
                  },
                },
              },
            });

            const outboxType = `Shipment${newStatus.replace(/_/g, '')}`;
            await this.outbox.createEvent(
              'Shipment',
              shipment.id,
              outboxType,
              {
                eventId,
                eventType: outboxType,
                shipmentId: shipment.id,
                shipmentNumber: shipment.shipmentNumber,
                orderId: shipment.orderId,
                userId: shipment.userId,
                trackingNumber: shipment.trackingNumber,
                status: newStatus,
                timestamp: new Date(),
              },
              tx,
            );
          });

          await this.redis.del(`shipment:${shipment.id}`);
          await this.redis.del(`tracking:${shipment.id}`);
        }
      }
    }

    await this.prisma.shippingWebhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return { received: true };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OutboxService } from '../outbox/outbox.service';
import { LocalCarrierProvider } from '../carriers/local-carrier.provider';
import { DhlProvider } from '../carriers/dhl.provider';
import { FedexProvider } from '../carriers/fedex.provider';
import { UpsProvider } from '../carriers/ups.provider';
import { IShippingProvider } from '../carriers/carrier.interface';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment.dto';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { ShipmentStatus, ShippingMethod } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);
  private readonly providers: Map<string, IShippingProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly outbox: OutboxService,
    localProvider: LocalCarrierProvider,
    dhlProvider: DhlProvider,
    fedexProvider: FedexProvider,
    upsProvider: UpsProvider,
  ) {
    this.providers = new Map<string, IShippingProvider>([
      ['LOCAL', localProvider],
      ['DHL', dhlProvider],
      ['FEDEX', fedexProvider],
      ['UPS', upsProvider],
    ]);
  }

  private getProvider(carrierName?: string): IShippingProvider {
    const key = (carrierName || 'LOCAL').toUpperCase();
    return this.providers.get(key) || this.providers.get('LOCAL')!;
  }

  private calculateFee(method?: ShippingMethod): number {
    switch (method) {
      case ShippingMethod.EXPRESS:
        return 7.0;
      case ShippingMethod.SAME_DAY:
        return 15.0;
      case ShippingMethod.NEXT_DAY:
        return 10.0;
      case ShippingMethod.PICKUP:
        return 0.0;
      case ShippingMethod.STANDARD:
      default:
        return 3.0;
    }
  }

  async createShipment(userId: string, dto: CreateShipmentDto) {
    this.logger.log(`Creating shipment for order ${dto.orderId}, user ${userId}`);

    // 1. Idempotency Check
    if (dto.idempotencyKey) {
      const existingKey = await this.prisma.idempotencyKey.findUnique({
        where: {
          key_operation: {
            key: dto.idempotencyKey,
            operation: 'create_shipment',
          },
        },
      });

      if (existingKey && existingKey.shipmentId) {
        this.logger.log(`Idempotent replay found for key ${dto.idempotencyKey}`);
        const existingShipment = await this.getShipmentById(existingKey.shipmentId, userId, true);
        return existingShipment;
      }
    }

    // 2. Generate unique shipment number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    const shipmentNumber = `SHP-${dateStr}-${randSuffix}`;

    const carrier = (dto.carrier || 'LOCAL').toUpperCase();
    const provider = this.getProvider(carrier);
    const shippingMethod = dto.shippingMethod || ShippingMethod.STANDARD;
    const shippingFee = this.calculateFee(shippingMethod);

    // 3. Delegate to Carrier Provider for Tracking Number
    const carrierResult = await provider.createShipment({
      shipmentNumber,
      orderId: dto.orderId,
      shippingMethod,
      recipientName: dto.address.recipientName,
      phone: dto.address.phone,
      addressLine1: dto.address.addressLine1,
      city: dto.address.city,
      country: dto.address.country,
      postalCode: dto.address.postalCode,
      itemsCount: dto.items.reduce((sum, item) => sum + item.quantity, 0),
    });

    const estDays = carrierResult.estimatedDeliveryDays || 3;
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estDays);

    // 4. Save shipment transactionally with address snapshot, items, tracking, and outbox
    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          shipmentNumber,
          orderId: dto.orderId,
          userId,
          status: ShipmentStatus.CREATED,
          shippingMethod,
          carrier: carrierResult.carrier,
          trackingNumber: carrierResult.trackingNumber,
          shippingFee,
          currency: 'USD',
          estimatedDeliveryDate,
          address: {
            create: {
              recipientName: dto.address.recipientName,
              phone: dto.address.phone,
              addressLine1: dto.address.addressLine1,
              addressLine2: dto.address.addressLine2,
              city: dto.address.city,
              district: dto.address.district,
              province: dto.address.province,
              country: dto.address.country,
              postalCode: dto.address.postalCode,
            },
          },
          items: {
            create: dto.items.map((item) => ({
              orderItemId: item.orderItemId,
              productId: item.productId,
              variantId: item.variantId,
              sku: item.sku,
              productName: item.productName,
              quantity: item.quantity,
            })),
          },
          trackingEvents: {
            create: {
              status: ShipmentStatus.CREATED,
              location: dto.address.city,
              description: 'Shipment created and ready for pickup',
              eventTime: new Date(),
            },
          },
        },
        include: {
          address: true,
          items: true,
          trackingEvents: true,
        },
      });

      if (dto.idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            key: dto.idempotencyKey,
            operation: 'create_shipment',
            orderId: dto.orderId,
            shipmentId: created.id,
          },
        });
      }

      await this.outbox.createEvent(
        'Shipment',
        created.id,
        'ShipmentCreated',
        {
          eventId: created.id,
          eventType: 'ShipmentCreated',
          shipmentId: created.id,
          shipmentNumber: created.shipmentNumber,
          orderId: created.orderId,
          userId: created.userId,
          trackingNumber: created.trackingNumber,
          carrier: created.carrier,
          shippingMethod: created.shippingMethod,
          status: created.status,
          timestamp: new Date(),
        },
        tx,
      );

      return created;
    });

    await this.redis.set(`shipment:${shipment.id}`, shipment, 600);
    return shipment;
  }

  async getShipmentById(id: string, userId: string, isAdmin = false) {
    const cached = await this.redis.get<any>(`shipment:${id}`);
    if (cached) {
      if (!isAdmin && cached.userId !== userId && userId !== 'anonymousUser') {
        throw new ForbiddenException('You do not have permission to view this shipment');
      }
      return cached;
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        address: true,
        items: true,
        trackingEvents: { orderBy: { eventTime: 'asc' } },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${id}" was not found`);
    }

    if (!isAdmin && shipment.userId !== userId && userId !== 'anonymousUser') {
      throw new ForbiddenException('You do not have permission to view this shipment');
    }

    await this.redis.set(`shipment:${id}`, shipment, 600);
    return shipment;
  }

  async getShipmentsByOrderId(orderId: string, userId: string, isAdmin = false) {
    const shipments = await this.prisma.shipment.findMany({
      where: { orderId },
      include: {
        address: true,
        items: true,
        trackingEvents: { orderBy: { eventTime: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (shipments.length > 0 && !isAdmin && shipments[0].userId !== userId && userId !== 'anonymousUser') {
      throw new ForbiddenException('You do not have permission to view shipments for this order');
    }

    return shipments;
  }

  async getUserShipments(userId: string, page = 1, size = 20) {
    const skip = Math.max(0, (page - 1) * size);
    const take = Math.max(1, size);

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { userId },
        include: { address: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.shipment.count({ where: { userId } }),
    ]);

    return {
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / take),
    };
  }

  async getAllShipments(page = 1, size = 20, status?: ShipmentStatus) {
    const skip = Math.max(0, (page - 1) * size);
    const take = Math.max(1, size);
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: { address: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / take),
    };
  }

  async updateShipmentStatus(id: string, dto: UpdateShipmentStatusDto) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${id}" was not found`);
    }

    const updates: any = { status: dto.status };
    if (dto.status === ShipmentStatus.IN_TRANSIT && !shipment.shippedAt) {
      updates.shippedAt = new Date();
    }
    if (dto.status === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
      updates.deliveredAt = new Date();
      updates.actualDeliveryDate = new Date();
    }

    const eventName = `Shipment${dto.status.replace(/_/g, '')}`;

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.shipment.update({
        where: { id },
        data: {
          ...updates,
          trackingEvents: {
            create: {
              status: dto.status,
              location: dto.location || 'Hub Facility',
              description: dto.description || `Shipment status updated to ${dto.status}`,
              eventTime: new Date(),
            },
          },
        },
        include: {
          address: true,
          items: true,
          trackingEvents: { orderBy: { eventTime: 'asc' } },
        },
      });

      await this.outbox.createEvent(
        'Shipment',
        s.id,
        eventName,
        {
          eventId: s.id,
          eventType: eventName,
          shipmentId: s.id,
          shipmentNumber: s.shipmentNumber,
          orderId: s.orderId,
          userId: s.userId,
          trackingNumber: s.trackingNumber,
          status: s.status,
          timestamp: new Date(),
        },
        tx,
      );

      return s;
    });

    await this.redis.del(`shipment:${id}`);
    return updated;
  }

  async cancelShipment(id: string, dto: CancelShipmentDto, userId: string, isAdmin = false) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${id}" was not found`);
    }

    if (!isAdmin && shipment.userId !== userId && userId !== 'anonymousUser') {
      throw new ForbiddenException('You do not have permission to cancel this shipment');
    }

    if (
      shipment.status === ShipmentStatus.IN_TRANSIT ||
      shipment.status === ShipmentStatus.OUT_FOR_DELIVERY ||
      shipment.status === ShipmentStatus.DELIVERED
    ) {
      throw new BadRequestException(
        `Cannot cancel shipment with status "${shipment.status}". The package is already in transit or delivered.`,
      );
    }

    const provider = this.getProvider(shipment.carrier);
    await provider.cancelShipment(shipment.trackingNumber);

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.CANCELLED,
          cancelledAt: new Date(),
          trackingEvents: {
            create: {
              status: ShipmentStatus.CANCELLED,
              location: 'Fulfillment Center',
              description: dto.reason || 'Shipment cancelled by customer/admin',
              eventTime: new Date(),
            },
          },
        },
        include: {
          address: true,
          items: true,
          trackingEvents: { orderBy: { eventTime: 'asc' } },
        },
      });

      await this.outbox.createEvent(
        'Shipment',
        s.id,
        'ShipmentCancelled',
        {
          eventId: s.id,
          eventType: 'ShipmentCancelled',
          shipmentId: s.id,
          shipmentNumber: s.shipmentNumber,
          orderId: s.orderId,
          userId: s.userId,
          status: s.status,
          reason: dto.reason,
          timestamp: new Date(),
        },
        tx,
      );

      return s;
    });

    await this.redis.del(`shipment:${id}`);
    return updated;
  }
}

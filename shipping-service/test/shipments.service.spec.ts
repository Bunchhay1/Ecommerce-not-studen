import { ShipmentsService } from '../src/shipments/shipments.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { OutboxService } from '../src/outbox/outbox.service';
import { LocalCarrierProvider } from '../src/carriers/local-carrier.provider';
import { DhlProvider } from '../src/carriers/dhl.provider';
import { FedexProvider } from '../src/carriers/fedex.provider';
import { UpsProvider } from '../src/carriers/ups.provider';
import { ShipmentStatus, ShippingMethod } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let prismaMock: any;
  let redisMock: any;
  let outboxMock: any;
  let localProvider: LocalCarrierProvider;
  let dhlProvider: any;
  let fedexProvider: any;
  let upsProvider: any;

  beforeEach(() => {
    prismaMock = {
      idempotencyKey: { findUnique: jest.fn().mockResolvedValue(null) },
      shipment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    outboxMock = {
      createEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    localProvider = new LocalCarrierProvider();
    dhlProvider = { createShipment: jest.fn(), cancelShipment: jest.fn() };
    fedexProvider = { createShipment: jest.fn(), cancelShipment: jest.fn() };
    upsProvider = { createShipment: jest.fn(), cancelShipment: jest.fn() };

    service = new ShipmentsService(
      prismaMock as unknown as PrismaService,
      redisMock as unknown as RedisService,
      outboxMock as unknown as OutboxService,
      localProvider,
      dhlProvider,
      fedexProvider,
      upsProvider,
    );
  });

  it('should create a shipment with address snapshot and items', async () => {
    prismaMock.shipment.create = jest.fn().mockResolvedValue({
      id: 'ship-uuid-1',
      shipmentNumber: 'SHP-20260913-111111',
      orderId: 'order-1',
      userId: 'user-1',
      status: ShipmentStatus.CREATED,
      shippingMethod: ShippingMethod.STANDARD,
      carrier: 'LOCAL',
      trackingNumber: 'LOC12345678KH',
      shippingFee: 3.0,
      currency: 'USD',
      address: { city: 'Phnom Penh' },
      items: [{ productName: 'Mouse' }],
      trackingEvents: [{ status: ShipmentStatus.CREATED }],
    });

    const result = await service.createShipment('user-1', {
      orderId: 'order-1',
      shippingMethod: ShippingMethod.STANDARD,
      address: {
        recipientName: 'Alice',
        phone: '+85512345678',
        addressLine1: 'Street 51',
        city: 'Phnom Penh',
        country: 'Cambodia',
        postalCode: '12000',
      },
      items: [
        {
          orderItemId: 'item-1',
          productId: 'prod-1',
          sku: 'MOUSE-01',
          productName: 'Mouse',
          quantity: 1,
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.shipmentNumber).toBe('SHP-20260913-111111');
    expect(result.carrier).toBe('LOCAL');
    expect(outboxMock.createEvent).toHaveBeenCalledWith(
      'Shipment',
      'ship-uuid-1',
      'ShipmentCreated',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should prevent cancelling a shipment that is already in transit', async () => {
    prismaMock.shipment.findUnique.mockResolvedValue({
      id: 'ship-2',
      status: ShipmentStatus.IN_TRANSIT,
      userId: 'user-1',
      carrier: 'LOCAL',
      trackingNumber: 'LOC8888KH',
    });

    await expect(
      service.cancelShipment('ship-2', { reason: 'changed mind' }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });
});

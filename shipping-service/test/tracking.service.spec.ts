import { TrackingService } from '../src/tracking/tracking.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('TrackingService', () => {
  let service: TrackingService;
  let prismaMock: any;
  let redisMock: any;

  beforeEach(() => {
    prismaMock = {
      shipment: {
        findUnique: jest.fn(),
      },
    };
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    service = new TrackingService(prismaMock, redisMock);
  });

  it('should return tracking information when shipment exists', async () => {
    prismaMock.shipment.findUnique.mockResolvedValue({
      id: 'ship-1',
      shipmentNumber: 'SHP-20260913-0001',
      trackingNumber: 'LOC12345678KH',
      carrier: 'LOCAL',
      status: 'IN_TRANSIT',
      estimatedDeliveryDate: new Date(),
      actualDeliveryDate: null,
      trackingEvents: [
        {
          id: 'evt-1',
          status: 'CREATED',
          location: 'Phnom Penh',
          description: 'Package created',
          eventTime: new Date(),
        },
      ],
    });

    const tracking = await service.getTrackingByShipmentId('ship-1');
    expect(tracking).toBeDefined();
    expect(tracking.shipmentNumber).toBe('SHP-20260913-0001');
    expect(tracking.trackingNumber).toBe('LOC12345678KH');
    expect(tracking.events.length).toBe(1);
  });

  it('should throw NotFoundException when shipment is not found', async () => {
    prismaMock.shipment.findUnique.mockResolvedValue(null);
    await expect(service.getTrackingByShipmentId('non-existent')).rejects.toThrow(NotFoundException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentsController } from '../src/shipments/shipments.controller';
import { ShipmentsService } from '../src/shipments/shipments.service';
import { ConfigService } from '@nestjs/config';
import { ShippingMethod } from '@prisma/client';

describe('ShipmentsController', () => {
  let controller: ShipmentsController;
  let serviceMock: Partial<ShipmentsService>;

  beforeEach(async () => {
    serviceMock = {
      createShipment: jest.fn().mockResolvedValue({
        id: 'ship-1',
        shipmentNumber: 'SHP-20260913-0001',
        status: 'CREATED',
      }),
      getShipmentById: jest.fn().mockResolvedValue({
        id: 'ship-1',
        shipmentNumber: 'SHP-20260913-0001',
      }),
      getUserShipments: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        size: 20,
        totalPages: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShipmentsController],
      providers: [
        { provide: ShipmentsService, useValue: serviceMock },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ShipmentsController>(ShipmentsController);
  });

  it('should create a shipment via controller', async () => {
    const req = { user: { id: 'user-1' } };
    const result = await controller.createShipment(req, {
      orderId: 'order-1',
      shippingMethod: ShippingMethod.STANDARD,
      address: {
        recipientName: 'Alice',
        phone: '+85512345678',
        addressLine1: 'Street 1',
        city: 'Phnom Penh',
        country: 'Cambodia',
        postalCode: '12000',
      },
      items: [
        {
          orderItemId: 'item-1',
          productId: 'prod-1',
          sku: 'SKU-1',
          productName: 'Sample Product',
          quantity: 1,
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.shipmentNumber).toBe('SHP-20260913-0001');
    expect(serviceMock.createShipment).toHaveBeenCalled();
  });

  it('should retrieve a shipment by ID', async () => {
    const req = { user: { id: 'user-1', roles: ['ROLE_CUSTOMER'] } };
    const result = await controller.getShipmentById(req, 'ship-1');
    expect(result).toBeDefined();
    expect(result.id).toBe('ship-1');
  });
});

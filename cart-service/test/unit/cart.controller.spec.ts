import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from '../../src/cart/cart.controller';
import { CartService } from '../../src/cart/cart.service';
import { ConfigService } from '@nestjs/config';
import { CartStatus } from '@prisma/client';

describe('CartController', () => {
  let controller: CartController;
  let service: jest.Mocked<CartService>;

  const mockUser = {
    userId: 'user-456',
    roles: ['CUSTOMER'],
  };

  const mockCartResponse = {
    id: 'cart-123',
    userId: 'user-456',
    status: CartStatus.ACTIVE,
    currency: 'USD',
    items: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    totalItems: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCartService = {
      getCart: jest.fn().mockResolvedValue(mockCartResponse),
      addItem: jest.fn().mockResolvedValue(mockCartResponse),
      updateItemQuantity: jest.fn().mockResolvedValue(mockCartResponse),
      removeItem: jest.fn().mockResolvedValue(mockCartResponse),
      clearCart: jest.fn().mockResolvedValue(mockCartResponse),
      getSummary: jest.fn().mockResolvedValue({
        cartId: 'cart-123',
        totalItems: 0,
        uniqueProducts: 0,
        subtotal: 0,
        total: 0,
        currency: 'USD',
      }),
      updateStatus: jest.fn().mockResolvedValue({
        ...mockCartResponse,
        status: CartStatus.CHECKOUT,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: mockCartService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    service = module.get(CartService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCart should call service.getCart with user id', async () => {
    const result = await controller.getCart(mockUser);
    expect(result).toBeDefined();
    expect(service.getCart).toHaveBeenCalledWith('user-456');
  });

  it('addItem should call service.addItem', async () => {
    const dto = { productId: 'prod-1', variantId: 'var-1', quantity: 2 };
    await controller.addItem(mockUser, dto);
    expect(service.addItem).toHaveBeenCalledWith('user-456', dto);
  });

  it('updateItemQuantity should call service.updateItemQuantity', async () => {
    const dto = { quantity: 5 };
    await controller.updateItemQuantity(mockUser, 'item-1', dto);
    expect(service.updateItemQuantity).toHaveBeenCalledWith('user-456', 'item-1', dto);
  });

  it('removeItem should call service.removeItem', async () => {
    await controller.removeItem(mockUser, 'item-1');
    expect(service.removeItem).toHaveBeenCalledWith('user-456', 'item-1');
  });

  it('clearCart should call service.clearCart', async () => {
    await controller.clearCart(mockUser);
    expect(service.clearCart).toHaveBeenCalledWith('user-456');
  });

  it('getSummary should call service.getSummary', async () => {
    await controller.getCartSummary(mockUser);
    expect(service.getSummary).toHaveBeenCalledWith('user-456');
  });

  it('updateStatus should call service.updateStatus', async () => {
    const dto = { status: CartStatus.CHECKOUT };
    await controller.updateStatus(mockUser, dto);
    expect(service.updateStatus).toHaveBeenCalledWith('user-456', dto);
  });
});

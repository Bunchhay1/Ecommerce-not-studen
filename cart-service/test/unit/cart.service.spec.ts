import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '../../src/cart/cart.service';
import { CartRepository } from '../../src/cart/cart.repository';
import { RedisService } from '../../src/redis/redis.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { CatalogClient } from '../../src/catalog/catalog.client';
import { CartStatus, Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let repository: jest.Mocked<CartRepository>;
  let redis: jest.Mocked<RedisService>;
  let kafka: jest.Mocked<KafkaProducer>;
  let catalog: jest.Mocked<CatalogClient>;

  const mockCart = {
    id: 'cart-123',
    userId: 'user-456',
    status: CartStatus.ACTIVE,
    currency: 'USD',
    subtotal: new Prisma.Decimal(1499.0),
    total: new Prisma.Decimal(1499.0),
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null,
    items: [
      {
        id: 'item-1',
        cartId: 'cart-123',
        productId: 'prod-100',
        variantId: 'var-1',
        quantity: 2,
        unitPrice: new Prisma.Decimal(749.5),
        subtotal: new Prisma.Decimal(1499.0),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findOrCreateCart: jest.fn().mockResolvedValue(mockCart),
      getCartByUserId: jest.fn().mockResolvedValue(mockCart),
      addItem: jest.fn().mockResolvedValue(mockCart),
      updateItemQuantity: jest.fn().mockResolvedValue(mockCart),
      removeItem: jest.fn().mockResolvedValue({
        ...mockCart,
        items: [],
        subtotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
      }),
      clearCart: jest.fn().mockResolvedValue({
        ...mockCart,
        items: [],
        subtotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
      }),
      updateStatus: jest.fn().mockResolvedValue({
        ...mockCart,
        status: CartStatus.CHECKOUT,
      }),
    };

    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    const mockKafka = {
      publishCartEvent: jest.fn().mockResolvedValue(undefined),
      isHealthy: jest.fn().mockReturnValue(true),
    };

    const mockCatalog = {
      verifyProductAndVariant: jest.fn().mockResolvedValue({
        productId: 'prod-100',
        variantId: 'var-1',
        name: 'iPhone 17 Pro',
        sku: 'IPH17P-256-BLK',
        unitPrice: 749.5,
        currency: 'USD',
        isAvailable: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: KafkaProducer, useValue: mockKafka },
        { provide: CatalogClient, useValue: mockCatalog },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    repository = module.get(CartRepository);
    redis = module.get(RedisService);
    kafka = module.get(KafkaProducer);
    catalog = module.get(CatalogClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return cart from database on cache miss and store in redis', async () => {
      const result = await service.getCart('user-456');

      expect(result).toBeDefined();
      expect(result.id).toBe('cart-123');
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1499.0);
      expect(repository.findOrCreateCart).toHaveBeenCalledWith('user-456');
      expect(redis.set).toHaveBeenCalled();
    });

    it('should return cached cart on cache hit without database query', async () => {
      const cachedCart = {
        id: 'cart-cached',
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
      redis.get.mockResolvedValueOnce(cachedCart);

      const result = await service.getCart('user-456');

      expect(result.id).toBe('cart-cached');
      expect(repository.findOrCreateCart).not.toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should verify product with catalog client, add to repository, and publish kafka event', async () => {
      const result = await service.addItem('user-456', {
        productId: 'prod-100',
        variantId: 'var-1',
        quantity: 2,
      });

      expect(result).toBeDefined();
      expect(catalog.verifyProductAndVariant).toHaveBeenCalledWith('prod-100', 'var-1');
      expect(repository.addItem).toHaveBeenCalledWith('cart-123', 'prod-100', 'var-1', 2, 749.5);
      expect(kafka.publishCartEvent).toHaveBeenCalledWith('CartItemAdded', 'CartItem', 'cart-123', expect.any(Object));
      expect(redis.set).toHaveBeenCalled();
    });

    it('should throw BadRequestException if product is not available', async () => {
      catalog.verifyProductAndVariant.mockResolvedValueOnce({
        productId: 'prod-100',
        variantId: 'var-1',
        name: 'iPhone 17 Pro',
        sku: 'IPH17P-256-BLK',
        unitPrice: 749.5,
        currency: 'USD',
        isAvailable: false,
      });

      await expect(
        service.addItem('user-456', {
          productId: 'prod-100',
          variantId: 'var-1',
          quantity: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update quantity, refresh cache, and publish event', async () => {
      const result = await service.updateItemQuantity('user-456', 'item-1', {
        quantity: 3,
      });

      expect(result).toBeDefined();
      expect(repository.updateItemQuantity).toHaveBeenCalledWith('cart-123', 'item-1', 3);
      expect(kafka.publishCartEvent).toHaveBeenCalledWith('CartItemUpdated', 'CartItem', 'cart-123', expect.any(Object));
    });
  });

  describe('removeItem', () => {
    it('should remove item and publish CartItemRemoved event', async () => {
      const result = await service.removeItem('user-456', 'item-1');

      expect(result).toBeDefined();
      expect(repository.removeItem).toHaveBeenCalledWith('cart-123', 'item-1');
      expect(kafka.publishCartEvent).toHaveBeenCalledWith('CartItemRemoved', 'CartItem', 'cart-123', expect.any(Object));
    });
  });

  describe('clearCart', () => {
    it('should clear all items and publish CartCleared event', async () => {
      const result = await service.clearCart('user-456');

      expect(result).toBeDefined();
      expect(repository.clearCart).toHaveBeenCalledWith('cart-123');
      expect(kafka.publishCartEvent).toHaveBeenCalledWith('CartCleared', 'Cart', 'cart-123', expect.any(Object));
    });
  });

  describe('getSummary', () => {
    it('should return summary with total items count and totals', async () => {
      const summary = await service.getSummary('user-456');

      expect(summary).toBeDefined();
      expect(summary.cartId).toBe('cart-123');
      expect(summary.totalItems).toBe(2);
      expect(summary.uniqueProducts).toBe(1);
      expect(summary.total).toBe(1499.0);
    });
  });

  describe('updateStatus', () => {
    it('should update status and publish CartStatusChanged event', async () => {
      const result = await service.updateStatus('user-456', {
        status: CartStatus.CHECKOUT,
      });

      expect(result).toBeDefined();
      expect(repository.updateStatus).toHaveBeenCalledWith('cart-123', CartStatus.CHECKOUT);
      expect(kafka.publishCartEvent).toHaveBeenCalledWith('CartStatusChanged', 'Cart', 'cart-123', expect.any(Object));
    });
  });
});

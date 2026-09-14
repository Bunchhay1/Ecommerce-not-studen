import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository, CartWithItems } from './cart.repository';
import { RedisService } from '../redis/redis.service';
import { KafkaProducer } from '../kafka/kafka.producer';
import { CatalogClient } from '../catalog/catalog.client';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import {
  CartItemResponseDto,
  CartResponseDto,
  CartSummaryDto,
} from './dto/cart-response.dto';
import { CartStatus } from '@prisma/client';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducer,
    private readonly catalogClient: CatalogClient,
  ) {}

  private getCacheKey(userId: string): string {
    return `cart:user:${userId}`;
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cacheKey = this.getCacheKey(userId);

    // 1. Try Redis cache
    const cached = await this.redisService.get<CartResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cart cache HIT for user ${userId}`);
      return cached;
    }

    // 2. Query/Create in PostgreSQL
    const cart = await this.cartRepository.findOrCreateCart(userId);
    const responseDto = this.mapToResponseDto(cart);

    // 3. Populate Redis cache
    await this.redisService.set(cacheKey, responseDto);
    return responseDto;
  }

  async addItem(
    userId: string,
    dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    // 1. Ensure user has a cart
    const cart = await this.cartRepository.findOrCreateCart(userId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot modify cart in status ${cart.status}. Cart must be ACTIVE.`,
      );
    }

    // 2. Validate product & get trusted price from Catalog
    const verifiedProduct = await this.catalogClient.verifyProductAndVariant(
      dto.productId,
      dto.variantId,
    );

    if (!verifiedProduct.isAvailable) {
      throw new BadRequestException(
        `Product ${dto.productId} is currently not available for purchase`,
      );
    }

    // 3. Atomically add or increment in database
    const updatedCart = await this.cartRepository.addItem(
      cart.id,
      dto.productId,
      verifiedProduct.variantId,
      dto.quantity,
      verifiedProduct.unitPrice,
    );

    const responseDto = this.mapToResponseDto(updatedCart);

    // 4. Update cache
    await this.redisService.set(this.getCacheKey(userId), responseDto);

    // 5. Emit Kafka event
    await this.kafkaProducer.publishCartEvent(
      'CartItemAdded',
      'CartItem',
      cart.id,
      {
        cart_id: cart.id,
        user_id: userId,
        product_id: dto.productId,
        variant_id: verifiedProduct.variantId,
        quantity: dto.quantity,
        unit_price: verifiedProduct.unitPrice,
      },
    );

    return responseDto;
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreateCart(userId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot modify cart in status ${cart.status}`,
      );
    }

    const updatedCart = await this.cartRepository.updateItemQuantity(
      cart.id,
      itemId,
      dto.quantity,
    );

    const responseDto = this.mapToResponseDto(updatedCart);
    await this.redisService.set(this.getCacheKey(userId), responseDto);

    await this.kafkaProducer.publishCartEvent(
      'CartItemUpdated',
      'CartItem',
      cart.id,
      {
        cart_id: cart.id,
        user_id: userId,
        item_id: itemId,
        quantity: dto.quantity,
      },
    );

    return responseDto;
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreateCart(userId);

    const updatedCart = await this.cartRepository.removeItem(cart.id, itemId);
    const responseDto = this.mapToResponseDto(updatedCart);
    await this.redisService.set(this.getCacheKey(userId), responseDto);

    await this.kafkaProducer.publishCartEvent(
      'CartItemRemoved',
      'CartItem',
      cart.id,
      {
        cart_id: cart.id,
        user_id: userId,
        item_id: itemId,
      },
    );

    return responseDto;
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreateCart(userId);

    const updatedCart = await this.cartRepository.clearCart(cart.id);
    const responseDto = this.mapToResponseDto(updatedCart);
    await this.redisService.set(this.getCacheKey(userId), responseDto);

    await this.kafkaProducer.publishCartEvent(
      'CartCleared',
      'Cart',
      cart.id,
      {
        cart_id: cart.id,
        user_id: userId,
      },
    );

    return responseDto;
  }

  async getSummary(userId: string): Promise<CartSummaryDto> {
    const cart = await this.getCart(userId);

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cartId: cart.id,
      totalItems,
      uniqueProducts: cart.items.length,
      subtotal: cart.subtotal,
      total: cart.total,
      currency: cart.currency,
    };
  }

  async updateStatus(
    userId: string,
    dto: UpdateCartStatusDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreateCart(userId);

    const updatedCart = await this.cartRepository.updateStatus(
      cart.id,
      dto.status,
    );

    const responseDto = this.mapToResponseDto(updatedCart);
    await this.redisService.set(this.getCacheKey(userId), responseDto);

    const eventType =
      dto.status === CartStatus.CONVERTED
        ? 'CartConverted'
        : dto.status === CartStatus.ABANDONED
        ? 'CartAbandoned'
        : 'CartStatusChanged';

    await this.kafkaProducer.publishCartEvent(eventType, 'Cart', cart.id, {
      cart_id: cart.id,
      user_id: userId,
      status: dto.status,
    });

    return responseDto;
  }

  private mapToResponseDto(cart: CartWithItems): CartResponseDto {
    const items: CartItemResponseDto[] = (cart.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Number(cart.subtotal);
    const discount = 0.0;
    const shipping = 0.0;
    const total = Number(cart.total);

    return {
      id: cart.id,
      userId: cart.userId,
      status: cart.status,
      currency: cart.currency,
      items,
      subtotal,
      discount,
      shipping,
      total,
      totalItems,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}

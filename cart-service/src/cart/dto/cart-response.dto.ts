import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '@prisma/client';

export class CartItemResponseDto {
  @ApiProperty({ example: 'item_123' })
  id: string;

  @ApiProperty({ example: 'prod-100' })
  productId: string;

  @ApiProperty({ example: 'var-256-blk' })
  variantId: string;

  @ApiProperty({ example: 'iPhone 17 Pro' })
  name?: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 749.5 })
  unitPrice: number;

  @ApiProperty({ example: 1499.0 })
  subtotal: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CartResponseDto {
  @ApiProperty({ example: 'cart_123' })
  id: string;

  @ApiProperty({ example: 'user_456' })
  userId: string;

  @ApiProperty({ enum: CartStatus, example: CartStatus.ACTIVE })
  status: CartStatus;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 1499.0 })
  subtotal: number;

  @ApiProperty({ example: 0.0 })
  discount: number;

  @ApiProperty({ example: 0.0 })
  shipping: number;

  @ApiProperty({ example: 1499.0 })
  total: number;

  @ApiProperty({ example: 2 })
  totalItems: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CartSummaryDto {
  @ApiProperty({ example: 'cart_123' })
  cartId: string;

  @ApiProperty({ example: 3 })
  totalItems: number;

  @ApiProperty({ example: 2 })
  uniqueProducts: number;

  @ApiProperty({ example: 1499.0 })
  subtotal: number;

  @ApiProperty({ example: 1499.0 })
  total: number;

  @ApiProperty({ example: 'USD' })
  currency: string;
}

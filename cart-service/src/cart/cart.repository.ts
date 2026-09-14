import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cart, CartItem, CartStatus, Prisma } from '@prisma/client';

export type CartWithItems = Cart & {
  items: CartItem[];
};

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateCart(userId: string): Promise<CartWithItems> {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: {
        userId,
        status: CartStatus.ACTIVE,
        currency: 'USD',
        subtotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
      },
      include: { items: true },
    });
  }

  async getCartByUserId(userId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getCartById(cartId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async addItem(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number,
    unitPrice: number,
  ): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const priceDecimal = new Prisma.Decimal(unitPrice);
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId,
            variantId,
          },
        },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newSubtotal = priceDecimal.mul(newQuantity);

        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            unitPrice: priceDecimal,
            subtotal: newSubtotal,
          },
        });
      } else {
        const itemSubtotal = priceDecimal.mul(quantity);
        await tx.cartItem.create({
          data: {
            cartId,
            productId,
            variantId,
            quantity,
            unitPrice: priceDecimal,
            subtotal: itemSubtotal,
          },
        });
      }

      await this.recalculateCartTotals(tx, cartId);

      return tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      });
    });
  }

  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cartId },
      });

      if (!item) {
        throw new NotFoundException(`Cart item not found with id: ${itemId}`);
      }

      const newSubtotal = item.unitPrice.mul(quantity);

      await tx.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          subtotal: newSubtotal,
        },
      });

      await this.recalculateCartTotals(tx, cartId);

      return tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      });
    });
  }

  async removeItem(cartId: string, itemId: string): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cartId },
      });

      if (!item) {
        throw new NotFoundException(`Cart item not found with id: ${itemId}`);
      }

      await tx.cartItem.delete({
        where: { id: itemId },
      });

      await this.recalculateCartTotals(tx, cartId);

      return tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      });
    });
  }

  async clearCart(cartId: string): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { cartId },
      });

      await tx.cart.update({
        where: { id: cartId },
        data: {
          subtotal: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
        },
      });

      return tx.cart.findUnique({
        where: { id: cartId },
        include: { items: true },
      });
    });
  }

  async updateStatus(cartId: string, status: CartStatus): Promise<CartWithItems> {
    return this.prisma.cart.update({
      where: { id: cartId },
      data: { status },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
  }

  private async recalculateCartTotals(
    tx: Prisma.TransactionClient,
    cartId: string,
  ): Promise<void> {
    const items = await tx.cartItem.findMany({
      where: { cartId },
    });

    let totalDecimal = new Prisma.Decimal(0);
    for (const item of items) {
      totalDecimal = totalDecimal.add(item.subtotal);
    }

    await tx.cart.update({
      where: { id: cartId },
      data: {
        subtotal: totalDecimal,
        total: totalDecimal,
      },
    });
  }
}

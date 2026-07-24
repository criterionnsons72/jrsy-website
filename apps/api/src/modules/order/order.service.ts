import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerId(userId: string): Promise<string> {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new ForbiddenException('Only customers can place orders.');
    }
    return customer.id;
  }

  /**
   * Create a DRAFT order from the customer's cart. This is the order shell:
   * it freezes an immutable snapshot of the line items. Measurement review,
   * payment, and production come in later stages.
   */
  async createFromCart(userId: string): Promise<{ id: string; number: string; status: string }> {
    const customerId = await this.customerId(userId);

    const cart = await this.prisma.cart.findUnique({
      where: { customerId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }

    const items = cart.items.map((item) => {
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const lineTotal = unitPrice.mul(item.quantity);
      return {
        productId: item.productId,
        variantId: item.variantId,
        title: item.product.title,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        config: item.config ?? Prisma.JsonNull,
      };
    });

    const subtotal = items.reduce((sum, i) => sum.add(i.lineTotal), new Prisma.Decimal(0));

    const number = `TM-${Date.now().toString(36).toUpperCase()}`;

    // Immutable snapshot — later stages expand this (measurements, pricing, approvals…).
    const snapshot = {
      capturedAt: new Date().toISOString(),
      currency: cart.items[0]?.currency ?? 'PKR',
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        title: i.title,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toFixed(2),
        lineTotal: i.lineTotal.toFixed(2),
      })),
      subtotal: subtotal.toFixed(2),
    };

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number,
          customerId,
          status: 'draft',
          currency: cart.items[0]?.currency ?? 'PKR',
          subtotal,
          total: subtotal, // shipping/tax added at checkout in a later stage
          snapshot: snapshot as Prisma.InputJsonValue,
          items: { create: items },
        },
      });
      // Empty the cart now that it's an order.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return { id: order.id, number: order.number, status: order.status };
  }

  async list(userId: string) {
    const customerId = await this.customerId(userId);
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
      },
    });
  }

  async get(userId: string, id: string) {
    const customerId = await this.customerId(userId);
    const order = await this.prisma.order.findFirst({
      where: { id, customerId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    return order;
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import type { Selections } from '../configurator/schema.types';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  /** Resolve (or lazily create) the cart belonging to a user. */
  private async resolveCart(userId: string): Promise<{ id: string; customerId: string }> {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new ForbiddenException('Only customers have a cart.');
    }
    const cart = await this.prisma.cart.upsert({
      where: { customerId: customer.id },
      update: {},
      create: { customerId: customer.id },
    });
    return { id: cart.id, customerId: customer.id };
  }

  async getCart(userId: string) {
    const { id } = await this.resolveCart(userId);
    return this.withTotals(id);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const { id: cartId } = await this.resolveCart(userId);

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      include: { variants: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    let unitPrice = new Prisma.Decimal(product.basePrice);

    // A configured (made-to-measure) item prices via the pricing engine so the
    // cart matches the live price the customer saw on the configurator.
    if (dto.config) {
      const quote = await this.pricing.quote(product.slug, dto.config as Selections);
      if (!quote.valid) {
        throw new NotFoundException(
          quote.errors[0] ?? 'This configuration is not valid — please review your options.',
        );
      }
      unitPrice = new Prisma.Decimal(quote.garmentSubtotal);
    } else if (dto.variantId) {
      const variant = product.variants.find((v) => v.id === dto.variantId && v.isActive);
      if (!variant) {
        throw new NotFoundException('Variant not found for this product.');
      }
      unitPrice = unitPrice.add(variant.priceDelta);
    }

    // Prefer the explicit fit preference; fall back to the fit chosen in the config.
    const fitPreference =
      dto.fitPreference ?? (dto.config?.fit != null ? String(dto.config.fit) : null);

    await this.prisma.cartItem.create({
      data: {
        cartId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        quantity: dto.quantity,
        unitPrice,
        currency: product.currency,
        fitPreference,
        config: dto.config ? (dto.config as Prisma.InputJsonValue) : undefined,
        bodyProfileId: dto.bodyProfileId ?? null,
      },
    });

    return this.withTotals(cartId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const { id: cartId } = await this.resolveCart(userId);
    await this.assertItemInCart(cartId, itemId);
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.withTotals(cartId);
  }

  async removeItem(userId: string, itemId: string) {
    const { id: cartId } = await this.resolveCart(userId);
    await this.assertItemInCart(cartId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.withTotals(cartId);
  }

  private async assertItemInCart(cartId: string, itemId: string): Promise<void> {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cartId) {
      throw new NotFoundException('Cart item not found.');
    }
  }

  /** Return the cart with computed subtotal (a derived value, never stored). */
  private async withTotals(cartId: string) {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: { select: { title: true, slug: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const subtotal = cart.items.reduce(
      (sum, item) => sum.add(new Prisma.Decimal(item.unitPrice).mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    return {
      id: cart.id,
      items: cart.items,
      currency: cart.items[0]?.currency ?? 'PKR',
      subtotal: subtotal.toFixed(2),
      itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
    };
  }
}

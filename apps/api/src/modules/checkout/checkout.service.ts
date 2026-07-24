import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment.interface';
import { CheckoutDto } from './dto/checkout.dto';

const SHIPPING: Record<'standard' | 'express', number> = { standard: 250, express: 750 };

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly payment: PaymentProvider,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    if (!dto.acceptPolicy) {
      throw new BadRequestException('You must accept the custom-order policy to place the order.');
    }

    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('Only customers can check out.');

    const cart = await this.prisma.cart.findUnique({
      where: { customerId: customer.id },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }

    // Made-to-measure items (no ready-size variant chosen) require measurement approval.
    const hasMadeToMeasure = cart.items.some((i) => !i.variantId);
    if (hasMadeToMeasure && !dto.measurementApproved) {
      throw new BadRequestException(
        'Please confirm your measurements are correct for made-to-measure items.',
      );
    }

    const currency = cart.items[0]?.currency ?? 'PKR';
    const subtotal = cart.items.reduce(
      (sum, i) => sum.add(new Prisma.Decimal(i.unitPrice).mul(i.quantity)),
      new Prisma.Decimal(0),
    );
    const shipping = new Prisma.Decimal(SHIPPING[dto.shippingMethod]);
    const tax = subtotal.add(shipping).mul(dto.taxRate ?? 0);
    const total = subtotal.add(shipping).add(tax);

    const number = `TM-${Date.now().toString(36).toUpperCase()}`;

    const charge = await this.payment.charge({
      amountCents: Math.round(total.toNumber() * 100),
      currency,
      method: dto.paymentMethod,
      orderNumber: number,
    });
    if (charge.status === 'failed') {
      throw new BadRequestException('Payment failed. Please try another method.');
    }

    const items = cart.items.map((i) => {
      const unitPrice = new Prisma.Decimal(i.unitPrice);
      return {
        productId: i.productId,
        variantId: i.variantId,
        title: i.product.title,
        quantity: i.quantity,
        unitPrice,
        lineTotal: unitPrice.mul(i.quantity),
        config: (i.config ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      };
    });

    const snapshot = {
      capturedAt: new Date().toISOString(),
      currency,
      address: dto.address,
      shippingMethod: dto.shippingMethod,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        title: i.title,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toFixed(2),
        lineTotal: i.lineTotal.toFixed(2),
        config: i.config,
      })),
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      measurementApproved: Boolean(dto.measurementApproved),
      policyAcceptedAt: new Date().toISOString(),
    };

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number,
          customerId: customer.id,
          status: 'payment_complete',
          currency,
          subtotal,
          shipping,
          tax,
          total,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
          items: { create: items },
          payment: {
            create: {
              provider: this.payment.name,
              method: dto.paymentMethod,
              status: charge.status === 'paid' ? 'paid' : 'pending',
              amount: total,
              currency,
              providerRef: charge.providerRef,
            },
          },
        },
      });

      // Save the address for reuse.
      await tx.address.create({
        data: {
          customerId: customer.id,
          fullName: dto.address.fullName,
          phone: dto.address.phone,
          line: dto.address.line,
          city: dto.address.city,
          postalCode: dto.address.postalCode ?? null,
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return {
      orderId: order.id,
      number: order.number,
      status: order.status,
      total: total.toFixed(2),
      currency,
      payment: charge.status,
    };
  }
}

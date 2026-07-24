import { BadRequestException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MockPaymentProvider } from './mock-payment.provider';
import { CheckoutDto } from './dto/checkout.dto';

const address = { fullName: 'A', phone: '1', line: 'x', city: 'y' };

function svc(prisma: Partial<PrismaService>): CheckoutService {
  return new CheckoutService(prisma as PrismaService, new MockPaymentProvider());
}

describe('CheckoutService', () => {
  it('rejects when the policy is not accepted', async () => {
    const s = svc({});
    const dto = {
      address,
      shippingMethod: 'standard',
      paymentMethod: 'card',
      acceptPolicy: false,
    } as CheckoutDto;
    await expect(s.checkout('u', dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty cart', async () => {
    const prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 'cart1', items: [] }) },
    };
    const dto = {
      address,
      shippingMethod: 'standard',
      paymentMethod: 'card',
      acceptPolicy: true,
    } as CheckoutDto;
    await expect(svc(prisma as unknown as PrismaService).checkout('u', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires measurement approval for made-to-measure items', async () => {
    const prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
      cart: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cart1',
          items: [
            {
              variantId: null,
              unitPrice: '4500',
              quantity: 1,
              currency: 'PKR',
              product: { title: 'Kurta' },
            },
          ],
        }),
      },
    };
    const dto = {
      address,
      shippingMethod: 'standard',
      paymentMethod: 'card',
      acceptPolicy: true,
      measurementApproved: false,
    } as CheckoutDto;
    await expect(svc(prisma as unknown as PrismaService).checkout('u', dto)).rejects.toThrow(
      /measurements/i,
    );
  });
});

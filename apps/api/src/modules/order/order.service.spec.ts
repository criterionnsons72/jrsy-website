import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OrderService', () => {
  it('rejects creating an order from an empty cart', async () => {
    const prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'cust-1' }) },
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 'cart-1', items: [] }) },
    };
    const service = new OrderService(prisma as unknown as PrismaService);

    await expect(service.createFromCart('user-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks non-customers from listing orders', async () => {
    const prisma = { customer: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new OrderService(prisma as unknown as PrismaService);

    await expect(service.list('user-x')).rejects.toThrow('Only customers');
  });
});

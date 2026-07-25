import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Headline numbers for the admin dashboard. */
  async overview() {
    const [customers, products, ordersByStatus, revenue, pendingReviews, tryonActive] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.order.groupBy({ by: ['status'], _count: true }),
        this.prisma.order.aggregate({
          where: { status: { in: ['payment_complete', 'delivered'] } },
          _sum: { total: true },
        }),
        this.prisma.measurementReview.count({ where: { status: 'pending' } }),
        this.prisma.tryOnJob.count({ where: { status: { in: ['queued', 'processing'] } } }),
      ]);

    const inProduction = ordersByStatus
      .filter((o) =>
        [
          'pattern_preparation',
          'fabric_allocation',
          'cutting',
          'stitching',
          'quality_control',
          'packing',
        ].includes(o.status),
      )
      .reduce((n, o) => n + o._count, 0);

    return {
      customers,
      products,
      ordersByStatus,
      revenue: revenue._sum.total ?? 0,
      pendingMeasurementReviews: pendingReviews,
      activeTryOnJobs: tryonActive,
      ordersInProduction: inProduction,
    };
  }

  orders(params: { status?: string; take?: number }) {
    return this.prisma.order.findMany({
      where: params.status ? { status: params.status as never } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.take ?? 50, 200),
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        customer: { select: { fullName: true } },
      },
    });
  }

  auditLogs(take = 100) {
    return this.prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: Math.min(take, 500) });
  }

  // ---- Catalog management ----
  createCategory(data: { name: string; slug: string; sortOrder?: number }) {
    return this.prisma.category.create({ data });
  }

  createFabric(data: {
    name: string;
    stretch: 'stretch' | 'non_stretch';
    pricePerUnit: number;
    colorHex?: string;
  }) {
    return this.prisma.fabric.create({
      data: {
        name: data.name,
        stretch: data.stretch,
        pricePerUnit: new Prisma.Decimal(data.pricePerUnit),
        colorHex: data.colorHex ?? null,
      },
    });
  }

  listProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        configSchema: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Create a product. If no configuration schema is given, attach the first
   * published one so the new product is configurable out of the box.
   */
  async createProduct(data: {
    title: string;
    slug: string;
    categoryId: string;
    basePrice: number;
    description?: string;
    currency?: string;
    madeToMeasure?: boolean;
    readySize?: boolean;
    configSchemaId?: string;
    images?: string[];
  }) {
    const configSchemaId = data.configSchemaId ?? (await this.defaultConfigSchemaId());
    return this.prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        categoryId: data.categoryId,
        basePrice: new Prisma.Decimal(data.basePrice),
        description: data.description ?? null,
        currency: data.currency ?? 'PKR',
        madeToMeasure: data.madeToMeasure ?? true,
        readySize: data.readySize ?? true,
        configSchemaId,
        images: data.images?.length
          ? { create: data.images.map((url, i) => ({ url, sortOrder: i })) }
          : undefined,
      },
      include: { images: true },
    });
  }

  async updateProduct(
    id: string,
    data: {
      title?: string;
      categoryId?: string;
      basePrice?: number;
      description?: string;
      currency?: string;
      madeToMeasure?: boolean;
      readySize?: boolean;
      isActive?: boolean;
      configSchemaId?: string;
      images?: string[];
    },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');

    // Replace images wholesale when a new list is supplied.
    if (data.images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        categoryId: data.categoryId,
        basePrice: data.basePrice !== undefined ? new Prisma.Decimal(data.basePrice) : undefined,
        description: data.description,
        currency: data.currency,
        madeToMeasure: data.madeToMeasure,
        readySize: data.readySize,
        isActive: data.isActive,
        configSchemaId: data.configSchemaId,
        images: data.images
          ? { create: data.images.map((url, i) => ({ url, sortOrder: i })) }
          : undefined,
      },
      include: { images: true },
    });
  }

  /**
   * Remove a product. Products referenced by carts/orders cannot be hard-
   * deleted, so fall back to deactivating (hiding) them from the storefront.
   */
  async deleteProduct(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');
    try {
      await this.prisma.product.delete({ where: { id } });
      return { deleted: true, deactivated: false };
    } catch {
      // Foreign-key references (cart items, orders) — hide it instead.
      await this.prisma.product.update({ where: { id }, data: { isActive: false } });
      return { deleted: false, deactivated: true };
    }
  }

  private async defaultConfigSchemaId(): Promise<string | null> {
    const schema = await this.prisma.configSchema.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
    });
    return schema?.id ?? null;
  }

  // ---- Coupons ----
  listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createCoupon(data: {
    code: string;
    kind: 'percent' | 'fixed';
    value: number;
    expiresAt?: string;
  }) {
    return this.prisma.coupon.create({
      data: {
        code: data.code,
        kind: data.kind,
        value: new Prisma.Decimal(data.value),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  deactivateCoupon(id: string) {
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}

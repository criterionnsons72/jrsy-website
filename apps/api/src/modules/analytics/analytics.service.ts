import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface TrackInput {
  type: string;
  userId?: string;
  sessionId?: string;
  props?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record a funnel/usage event. Fire-and-forget friendly. */
  track(input: TrackInput) {
    return this.prisma.analyticsEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        props: (input.props ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * KPI report — funnels from events + hard numbers from domain tables.
   * Rates guard against divide-by-zero.
   */
  async report() {
    const [eventCounts, ordersByStatus, tryonByStatus, tryonCost, tasks, remakes] =
      await Promise.all([
        this.prisma.analyticsEvent.groupBy({ by: ['type'], _count: true }),
        this.prisma.order.groupBy({ by: ['status'], _count: true }),
        this.prisma.tryOnJob.groupBy({ by: ['status'], _count: true }),
        this.prisma.tryOnJob.aggregate({ _sum: { costCents: true } }),
        this.prisma.productionTask.count(),
        this.prisma.productionTask.count({ where: { qcPassed: false } }),
      ]);

    const ev = (t: string) => eventCounts.find((e) => e.type === t)?._count ?? 0;
    const ordersDelivered =
      ordersByStatus.find((o) => o.status === 'delivered')?._count ?? 0;
    const ordersPlaced = ordersByStatus.reduce((n, o) => n + o._count, 0);

    const rate = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    const totalCostCents = tryonCost._sum.costCents ?? 0;

    return {
      funnels: {
        productViews: ev('product_view'),
        configuratorStarts: ev('configurator_start'),
        configuratorCompletions: ev('configurator_complete'),
        configuratorCompletionRate: rate(ev('configurator_complete'), ev('configurator_start')),
        measurementStarts: ev('measurement_start'),
        measurementCompletions: ev('measurement_complete'),
        measurementDropOffRate: rate(
          ev('measurement_start') - ev('measurement_complete'),
          ev('measurement_start'),
        ),
        tryOnRequests: ev('tryon_request'),
        tryOnSuccess: ev('tryon_success'),
        tryOnFailure: ev('tryon_failure'),
        tryOnToCartRate: rate(ev('add_to_cart'), ev('tryon_success')),
        cartToOrderRate: rate(ev('order_placed'), ev('add_to_cart')),
      },
      orders: { byStatus: ordersByStatus, placed: ordersPlaced, delivered: ordersDelivered },
      tryOn: {
        byStatus: tryonByStatus,
        totalCostCents,
        aiCostPerDeliveredOrderCents:
          ordersDelivered > 0 ? Math.round(totalCostCents / ordersDelivered) : 0,
      },
      production: {
        tasks,
        remakes,
        remakeRate: rate(remakes, tasks),
      },
    };
  }
}

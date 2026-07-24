import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PRODUCTION_ENTRY,
  allowedNext,
  canTransition,
  isProductionStage,
  type OrderStatus,
} from './order-flow';

interface HistoryEntry {
  stage: OrderStatus;
  at: string;
  byId: string;
}

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Advance an order to the next status, enforcing the state machine. */
  async advance(orderId: string, to: OrderStatus, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const from = order.status as OrderStatus;
    if (!canTransition(from, to)) {
      throw new BadRequestException(
        `Cannot move from "${from}" to "${to}". Allowed: ${allowedNext(from).join(', ') || 'none'}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id: orderId }, data: { status: to } });

      // Create the workshop task when production begins; append history otherwise.
      const entry: HistoryEntry = { stage: to, at: new Date().toISOString(), byId: actorId };
      if (to === PRODUCTION_ENTRY && !order.task) {
        await tx.productionTask.create({
          data: {
            orderId,
            code: order.number,
            stage: to,
            statusHistory: [entry] as unknown as Prisma.InputJsonValue,
          },
        });
      } else if (order.task) {
        const history = [
          ...((order.task.statusHistory as unknown as HistoryEntry[]) ?? []),
          entry,
        ];
        await tx.productionTask.update({
          where: { orderId },
          data: { stage: to, statusHistory: history as unknown as Prisma.InputJsonValue },
        });
      }

      await tx.auditLog.create({
        data: { actorId, action: 'order.advance', entity: 'Order', entityId: orderId, after: { to } },
      });

      return { id: updated.id, status: updated.status };
    });
  }

  /** Workshop production queue with delay flags. */
  async queue(filter?: { stage?: OrderStatus; operatorId?: string }) {
    const tasks = await this.prisma.productionTask.findMany({
      where: {
        ...(filter?.stage ? { stage: filter.stage } : {}),
        ...(filter?.operatorId ? { operatorId: filter.operatorId } : {}),
        stage: filter?.stage ?? { notIn: ['delivered', 'cancelled'] },
      },
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
      include: { order: { select: { number: true, customerId: true } } },
    });

    const now = Date.now();
    return tasks.map((t) => ({
      ...t,
      delayed: t.dueAt ? t.dueAt.getTime() < now : false,
    }));
  }

  async assignOperator(orderId: string, operatorId: string | null) {
    await this.getTask(orderId);
    return this.prisma.productionTask.update({ where: { orderId }, data: { operatorId } });
  }

  async setPriority(orderId: string, priority: number, dueAt?: string) {
    await this.getTask(orderId);
    return this.prisma.productionTask.update({
      where: { orderId },
      data: { priority, ...(dueAt ? { dueAt: new Date(dueAt) } : {}) },
    });
  }

  async addNote(orderId: string, note: string) {
    await this.getTask(orderId);
    return this.prisma.productionTask.update({ where: { orderId }, data: { notes: note } });
  }

  /**
   * Quality control decision. Pass → advance to packing; fail → back to
   * stitching (remake). The finished-garment measurements are recorded.
   */
  async qcDecision(
    orderId: string,
    actorId: string,
    input: { pass: boolean; finalMeasurements?: Record<string, number>; notes?: string },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== 'quality_control') {
      throw new BadRequestException('Order is not in quality control.');
    }
    if (!input.pass && !input.notes) {
      throw new BadRequestException('A note is required when failing QC.');
    }

    await this.prisma.productionTask.update({
      where: { orderId },
      data: {
        qcPassed: input.pass,
        qcNotes: input.notes ?? null,
        finalMeasurements: (input.finalMeasurements ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    // Pass → packing; fail → stitching (remake loop).
    return this.advance(orderId, input.pass ? 'packing' : 'stitching', actorId);
  }

  private async getTask(orderId: string) {
    const task = await this.prisma.productionTask.findUnique({ where: { orderId } });
    if (!task) throw new NotFoundException('No production task for this order yet.');
    if (!isProductionStage(task.stage as OrderStatus)) {
      // still allow meta edits, but surface state
    }
    return task;
  }
}

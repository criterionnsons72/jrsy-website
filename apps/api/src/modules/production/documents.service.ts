import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type DocumentType =
  | 'measurement_sheet'
  | 'tech_pack'
  | 'bom'
  | 'fabric_consumption'
  | 'cutting'
  | 'stitching'
  | 'qc'
  | 'packing';

interface SnapshotItem {
  title: string;
  quantity: number;
  unitPrice: string;
  config?: Record<string, unknown> | null;
}

/**
 * Builds structured production documents from the order snapshot + production
 * task. Content is stored as JSON; a background worker renders it to PDF/CSV
 * (the assetRef). Here we generate and persist the content, and can emit HTML
 * for print-to-PDF in the meantime.
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(orderId: string, type: DocumentType) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const snapshot = order.snapshot as {
      items?: SnapshotItem[];
      currency?: string;
      subtotal?: string;
    };
    const items = snapshot.items ?? [];
    const finalMeasurements =
      (order.task?.finalMeasurements as Record<string, number> | null) ?? null;

    const content = this.build(type, { orderNumber: order.number, items, finalMeasurements });

    const doc = await this.prisma.document.upsert({
      where: { orderId_type: { orderId, type } },
      update: { content: content as Prisma.InputJsonValue },
      create: { orderId, type, content: content as Prisma.InputJsonValue },
    });
    return doc;
  }

  list(orderId: string) {
    return this.prisma.document.findMany({ where: { orderId }, orderBy: { type: 'asc' } });
  }

  async get(orderId: string, type: DocumentType) {
    const doc = await this.prisma.document.findUnique({
      where: { orderId_type: { orderId, type } },
    });
    if (!doc) throw new NotFoundException('Document not generated yet.');
    return doc;
  }

  private build(
    type: DocumentType,
    ctx: {
      orderNumber: string;
      items: SnapshotItem[];
      finalMeasurements: Record<string, number> | null;
    },
  ): Record<string, unknown> {
    const header = {
      document: type,
      order: ctx.orderNumber,
      generatedAt: new Date().toISOString(),
    };

    switch (type) {
      case 'tech_pack':
        return {
          ...header,
          items: ctx.items.map((i) => ({
            title: i.title,
            quantity: i.quantity,
            options: i.config ?? {},
          })),
        };
      case 'measurement_sheet':
        return {
          ...header,
          finalMeasurements: ctx.finalMeasurements ?? {},
          note: ctx.finalMeasurements ? 'Final production measurements' : 'Pending QC measurement',
        };
      case 'bom':
        return {
          ...header,
          lines: ctx.items.flatMap((i) => this.bomLines(i)),
        };
      case 'fabric_consumption':
        return {
          ...header,
          estimates: ctx.items.map((i) => ({
            title: i.title,
            fabric: (i.config?.fabric as string) ?? 'default',
            estimatedMeters: 2.5 * i.quantity, // simple estimate; refined by pattern data later
          })),
        };
      case 'cutting':
        return { ...header, instructions: ctx.items.map((i) => `Cut ${i.quantity}× ${i.title}`) };
      case 'stitching':
        return {
          ...header,
          instructions: ctx.items.map((i) => ({ title: i.title, options: i.config ?? {} })),
        };
      case 'qc':
        return {
          ...header,
          checklist: [
            'Measurements match the sheet (within tolerance)',
            'Seams even and secure',
            'Collar / cuff symmetry',
            'Embroidery / logo placement correct',
            'No fabric flaws or stains',
            'Buttons / plackets aligned',
          ].map((item) => ({ item, checked: false })),
          finalMeasurements: ctx.finalMeasurements ?? {},
        };
      case 'packing':
        return {
          ...header,
          items: ctx.items.map((i) => ({ title: i.title, quantity: i.quantity })),
        };
      default:
        return header;
    }
  }

  private bomLines(item: SnapshotItem): { component: string; detail: string }[] {
    const cfg = (item.config ?? {}) as Record<string, unknown>;
    const lines: { component: string; detail: string }[] = [
      { component: 'Fabric', detail: String(cfg.fabric ?? 'default') },
    ];
    if (cfg.collar) lines.push({ component: 'Collar', detail: String(cfg.collar) });
    if (cfg.cuff) lines.push({ component: 'Cuff', detail: String(cfg.cuff) });
    if (cfg.embroidery && cfg.embroidery !== 'none') {
      lines.push({ component: 'Embroidery', detail: String(cfg.embroidery) });
    }
    lines.push({ component: 'Thread & notions', detail: 'standard set' });
    return lines;
  }
}

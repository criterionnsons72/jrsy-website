import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigSchemaService } from '../configurator/config-schema.service';
import { RulesEngineService } from '../configurator/rules-engine.service';
import type { PriceLine, Selections } from '../configurator/schema.types';

export interface PricingOptions {
  urgent?: boolean;
  taxRate?: number; // e.g. 0.17 — configurable; default 0 (placeholder until finalised)
  shipping?: number; // flat; default 0
}

export interface PricingSnapshot {
  currency: string;
  capturedAt: string;
  lines: PriceLine[];
  garmentSubtotal: number;
  urgentFee: number;
  tax: number;
  shipping: number;
  total: number;
  leadTimeDays: number;
  approvalRequired: boolean;
}

export interface PricingResult extends PricingSnapshot {
  valid: boolean;
  errors: string[];
}

/**
 * Dynamic pricing engine.
 *
 *   base product
 * + fabric / fabric consumption / measurement range   (from configurator lines)
 * + collar / cuff / lining / embroidery / monogram / logo (configurator lines)
 * + urgent production
 * + tax
 * + shipping
 * = total
 *
 * A deterministic PricingSnapshot is produced so it can be frozen onto the
 * order at placement (immutable — later price changes never affect it).
 */
@Injectable()
export class PricingService {
  private readonly URGENT_SURCHARGE_RATE = 0.2; // +20% on the garment subtotal

  constructor(
    private readonly prisma: PrismaService,
    private readonly schemas: ConfigSchemaService,
    private readonly rules: RulesEngineService,
  ) {}

  async quote(
    productSlug: string,
    selections: Selections,
    options: PricingOptions = {},
  ): Promise<PricingResult> {
    const product = await this.prisma.product.findFirst({
      where: { slug: productSlug, isActive: true },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productSlug}" not found.`);
    }

    const { definition } = await this.schemas.forProductSlug(productSlug);
    const evaluation = this.rules.evaluate(definition, selections);

    const base = Number(product.basePrice);
    const lines: PriceLine[] = [
      { key: 'base', label: 'Base garment', amount: base },
      ...evaluation.priceLines,
    ];

    const garmentSubtotal = round2(base + evaluation.priceAdjustment);
    const urgentFee = options.urgent ? round2(garmentSubtotal * this.URGENT_SURCHARGE_RATE) : 0;
    const taxable = garmentSubtotal + urgentFee;
    const tax = round2(taxable * (options.taxRate ?? 0));
    const shipping = round2(options.shipping ?? 0);
    const total = round2(taxable + tax + shipping);

    if (urgentFee > 0) lines.push({ key: 'urgent', label: 'Urgent production', amount: urgentFee });

    return {
      valid: evaluation.valid,
      errors: evaluation.errors,
      currency: product.currency,
      capturedAt: new Date().toISOString(),
      lines,
      garmentSubtotal,
      urgentFee,
      tax,
      shipping,
      total,
      leadTimeDays: evaluation.leadTimeDays,
      approvalRequired: evaluation.approvalRequired,
    };
  }

  /** Strip the transient fields to store an immutable snapshot on an order. */
  toSnapshot(result: PricingResult): PricingSnapshot {
    const { valid: _valid, errors: _errors, ...snapshot } = result;
    return snapshot;
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

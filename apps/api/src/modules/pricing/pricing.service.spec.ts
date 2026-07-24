import { PricingService } from './pricing.service';
import { RulesEngineService } from '../configurator/rules-engine.service';
import { ConfigSchemaService } from '../configurator/config-schema.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { ConfigSchemaDefinition } from '../configurator/schema.types';

const definition: ConfigSchemaDefinition = {
  currency: 'PKR',
  baseLeadTimeDays: 5,
  groups: [
    {
      key: 'fabric',
      label: 'Fabric',
      type: 'select',
      default: 'cotton',
      choices: [
        { id: 'cotton', label: 'Cotton', priceDelta: 0 },
        { id: 'linen', label: 'Linen', priceDelta: 600 },
      ],
    },
  ],
};

function build(): PricingService {
  const prisma = {
    product: { findFirst: jest.fn().mockResolvedValue({ basePrice: 4500, currency: 'PKR' }) },
  } as unknown as PrismaService;
  const schemas = {
    forProductSlug: jest.fn().mockResolvedValue({ definition }),
  } as unknown as ConfigSchemaService;
  return new PricingService(prisma, schemas, new RulesEngineService());
}

describe('PricingService', () => {
  it('builds a base + option breakdown', async () => {
    const q = await build().quote('classic-cotton-kurta', { fabric: 'linen' });
    expect(q.garmentSubtotal).toBe(5100); // 4500 + 600
    expect(q.lines.find((l) => l.key === 'base')?.amount).toBe(4500);
    expect(q.total).toBe(5100); // no tax/shipping by default
  });

  it('adds a 20% urgent surcharge', async () => {
    const q = await build().quote('classic-cotton-kurta', { fabric: 'cotton' }, { urgent: true });
    expect(q.urgentFee).toBe(900); // 20% of 4500
    expect(q.total).toBe(5400);
  });

  it('applies tax and shipping when provided', async () => {
    const q = await build().quote(
      'classic-cotton-kurta',
      { fabric: 'cotton' },
      { taxRate: 0.1, shipping: 250 },
    );
    expect(q.tax).toBe(450); // 10% of 4500
    expect(q.total).toBe(4500 + 450 + 250);
  });

  it('produces a snapshot without transient fields', async () => {
    const service = build();
    const q = await service.quote('classic-cotton-kurta', { fabric: 'cotton' });
    const snap = service.toSnapshot(q);
    expect(snap).not.toHaveProperty('valid');
    expect(snap).not.toHaveProperty('errors');
    expect(snap.total).toBe(4500);
  });
});

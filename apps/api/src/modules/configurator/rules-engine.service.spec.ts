import { RulesEngineService } from './rules-engine.service';
import type { ConfigSchemaDefinition } from './schema.types';

const schema: ConfigSchemaDefinition = {
  currency: 'PKR',
  baseLeadTimeDays: 5,
  groups: [
    {
      key: 'fabric',
      label: 'Fabric',
      type: 'select',
      required: true,
      default: 'cotton',
      choices: [
        { id: 'cotton', label: 'Cotton', priceDelta: 0 },
        { id: 'linen', label: 'Linen', priceDelta: 600 },
      ],
    },
    {
      key: 'collar',
      label: 'Collar',
      type: 'select',
      choices: [
        { id: 'band', label: 'Band' },
        { id: 'wide', label: 'Wide' },
      ],
    },
    {
      key: 'embroidery',
      label: 'Embroidery',
      type: 'select',
      choices: [
        { id: 'none', label: 'None' },
        { id: 'full', label: 'Full front', priceDelta: 2500, leadTimeDays: 4, requiresApproval: true },
      ],
    },
    {
      key: 'length',
      label: 'Garment length',
      type: 'number',
      min: 38,
      max: 50,
      unit: 'in',
      pricePerUnitOver: { threshold: 46, amount: 150 },
    },
  ],
  rules: [
    {
      id: 'no-wide-collar-on-linen',
      description: 'Wide collar unavailable on linen',
      when: [{ group: 'fabric', equals: 'linen' }],
      then: [{ action: 'disableChoice', group: 'collar', choice: 'wide' }],
    },
  ],
};

describe('RulesEngineService', () => {
  const engine = new RulesEngineService();

  it('applies defaults and sums choice price deltas', () => {
    const r = engine.evaluate(schema, { fabric: 'linen', collar: 'band' });
    expect(r.valid).toBe(true);
    expect(r.priceAdjustment).toBe(600);
    expect(r.normalizedSelections.fabric).toBe('linen');
  });

  it('disables the wide collar on linen and errors if it is still chosen', () => {
    const r = engine.evaluate(schema, { fabric: 'linen', collar: 'wide' });
    expect(r.disabledChoices).toContainEqual({ group: 'collar', choice: 'wide' });
    expect(r.valid).toBe(false);
  });

  it('flags approval and adds lead time for full embroidery', () => {
    const r = engine.evaluate(schema, { fabric: 'cotton', embroidery: 'full' });
    expect(r.approvalRequired).toBe(true);
    expect(r.leadTimeDays).toBe(5 + 4);
    expect(r.priceAdjustment).toBe(2500);
  });

  it('validates numeric min/max and surcharges over the threshold', () => {
    const tooLong = engine.evaluate(schema, { fabric: 'cotton', length: 52 });
    expect(tooLong.valid).toBe(false);

    const ok = engine.evaluate(schema, { fabric: 'cotton', length: 48 });
    expect(ok.valid).toBe(true);
    expect(ok.priceAdjustment).toBe((48 - 46) * 150);
  });
});

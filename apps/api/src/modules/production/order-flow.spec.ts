import { allowedNext, canTransition, isProductionStage, PRODUCTION_ENTRY } from './order-flow';

describe('order-flow state machine', () => {
  it('allows the documented linear progression', () => {
    expect(canTransition('draft', 'measurement_review')).toBe(true);
    expect(canTransition('measurement_locked', 'pattern_preparation')).toBe(true);
    expect(canTransition('cutting', 'stitching')).toBe(true);
    expect(canTransition('packing', 'dispatch')).toBe(true);
    expect(canTransition('dispatch', 'delivered')).toBe(true);
  });

  it('rejects skipping stages', () => {
    expect(canTransition('draft', 'cutting')).toBe(false);
    expect(canTransition('measurement_locked', 'delivered')).toBe(false);
  });

  it('lets QC pass forward or fail back to stitching', () => {
    expect(canTransition('quality_control', 'packing')).toBe(true);
    expect(canTransition('quality_control', 'stitching')).toBe(true);
  });

  it('has no transitions out of terminal states', () => {
    expect(allowedNext('delivered')).toHaveLength(0);
    expect(allowedNext('cancelled')).toHaveLength(0);
  });

  it('marks production stages and the entry point', () => {
    expect(isProductionStage('cutting')).toBe(true);
    expect(isProductionStage('draft')).toBe(false);
    expect(PRODUCTION_ENTRY).toBe('pattern_preparation');
  });
});

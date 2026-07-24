import { MeasurementFormulaService } from './measurement-formula.service';

describe('MeasurementFormulaService', () => {
  const svc = new MeasurementFormulaService();

  it('adds ease to body for a regular fit, non-stretch', () => {
    const { garment, final } = svc.compute(
      { chest: 100 },
      { fit: 'regular', stretch: 'non_stretch' },
    );
    // chest ease 10, fit 0 → garment 110; final adds tolerance 0.5
    expect(garment.chest).toBe(110);
    expect(final.chest).toBe(110.5);
  });

  it('slim fit reduces girth ease; relaxed increases it', () => {
    const slim = svc.compute({ chest: 100 }, { fit: 'slim', stretch: 'non_stretch' });
    const relaxed = svc.compute({ chest: 100 }, { fit: 'relaxed', stretch: 'non_stretch' });
    expect(slim.garment.chest).toBeLessThan(relaxed.garment.chest);
  });

  it('stretch fabric needs less ease than non-stretch', () => {
    const stretch = svc.compute({ chest: 100 }, { fit: 'regular', stretch: 'stretch' });
    const nonStretch = svc.compute({ chest: 100 }, { fit: 'regular', stretch: 'non_stretch' });
    expect(stretch.garment.chest).toBeLessThan(nonStretch.garment.chest);
  });

  it('applies shrinkage allowance to the final measurement', () => {
    const { garment, final } = svc.compute(
      { chest: 100 },
      { fit: 'regular', stretch: 'non_stretch', shrinkageRate: 0.03, productionToleranceCm: 0 },
    );
    // final = garment + 3% shrinkage
    expect(final.chest).toBeCloseTo(garment.chest * 1.03, 1);
  });
});

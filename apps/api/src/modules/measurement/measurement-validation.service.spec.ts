import { MeasurementValidationService } from './measurement-validation.service';

describe('MeasurementValidationService', () => {
  const svc = new MeasurementValidationService();

  it('accepts a plausible measurement with matching dual entry', () => {
    const r = svc.validate({ chest: 100, waist: 88, hip: 102 }, 'manual', {
      chest: 100,
      waist: 88,
      hip: 102,
    });
    expect(r.errors).toHaveLength(0);
    expect(Object.keys(r.outlierFlags)).toHaveLength(0);
    expect(r.confidence).toBe(90); // -10 for manual source
  });

  it('errors when dual-entry values disagree beyond tolerance', () => {
    const r = svc.validate({ chest: 100 }, 'manual', { chest: 108 });
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('flags an out-of-range measurement as an outlier', () => {
    const r = svc.validate({ chest: 200 }, 'manual', { chest: 200 });
    expect(r.outlierFlags.chest).toBe('high');
    expect(r.confidence).toBeLessThan(90);
  });

  it('flags an implausible waist-to-chest ratio', () => {
    const r = svc.validate({ chest: 90, waist: 130 }, 'manual', { chest: 90, waist: 130 });
    expect(r.outlierFlags.waist).toBe('implausible');
  });

  it('lowers confidence more for questionnaire source', () => {
    const manual = svc.validate({ chest: 100 }, 'manual', { chest: 100 });
    const quiz = svc.validate({ chest: 100 }, 'questionnaire', { chest: 100 });
    expect(quiz.confidence).toBeLessThan(manual.confidence);
  });
});

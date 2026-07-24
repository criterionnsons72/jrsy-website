import { QualityCheckService } from './quality-check.service';

describe('QualityCheckService', () => {
  const svc = new QualityCheckService();

  it('passes a portrait full-body image of adequate size', () => {
    const r = svc.check({ width: 720, height: 1280, hasFullBody: true });
    expect(r.ok).toBe(true);
    expect(r.reasons).toHaveLength(0);
  });

  it('fails when metadata is missing', () => {
    expect(svc.check(undefined).ok).toBe(false);
  });

  it('fails a too-small image', () => {
    const r = svc.check({ width: 200, height: 300, hasFullBody: true });
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.includes('too small'))).toBe(true);
  });

  it('fails a landscape image', () => {
    const r = svc.check({ width: 1280, height: 720, hasFullBody: true });
    expect(r.ok).toBe(false);
  });

  it('fails when no full body is present', () => {
    const r = svc.check({ width: 720, height: 1280, hasFullBody: false });
    expect(r.ok).toBe(false);
  });
});

import { Injectable } from '@nestjs/common';

export interface ImageMeta {
  width?: number;
  height?: number;
  hasFullBody?: boolean;
}

export interface QualityResult {
  ok: boolean;
  reasons: string[];
}

/**
 * Pure image-quality gate run BEFORE a try-on job is created. Checks framing
 * and resolution from lightweight metadata (no image bytes). A real deployment
 * adds server-side analysis; this is the deterministic, testable contract.
 */
@Injectable()
export class QualityCheckService {
  private readonly MIN_WIDTH = 480;
  private readonly MIN_HEIGHT = 640;

  check(meta: ImageMeta | undefined): QualityResult {
    const reasons: string[] = [];
    if (!meta) {
      return { ok: false, reasons: ['Missing image metadata.'] };
    }
    if ((meta.width ?? 0) < this.MIN_WIDTH || (meta.height ?? 0) < this.MIN_HEIGHT) {
      reasons.push(`Image too small — use at least ${this.MIN_WIDTH}×${this.MIN_HEIGHT}.`);
    }
    if (meta.height && meta.width && meta.height < meta.width) {
      reasons.push('Use a portrait (full-body) photo, not landscape.');
    }
    if (meta.hasFullBody === false) {
      reasons.push('A full-body photo is needed for a style preview.');
    }
    return { ok: reasons.length === 0, reasons };
  }
}

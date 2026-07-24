import { Injectable } from '@nestjs/common';
import type { MeasurementValues } from './measurement-formula.service';

export type MeasurementSource = 'manual' | 'garment' | 'questionnaire' | 'scan' | 'in_store';

export interface ValidationResult {
  errors: string[]; // block submission
  outlierFlags: Record<string, 'high' | 'low' | 'implausible'>;
  confidence: number; // 0-100
}

/**
 * Pure measurement validation: plausibility ranges, ratio/outlier detection,
 * dual-entry confirmation for critical measurements, and a confidence score.
 * All values are centimetres.
 */
@Injectable()
export class MeasurementValidationService {
  // Plausible adult ranges (cm).
  private readonly RANGES: Record<string, { min: number; max: number }> = {
    chest: { min: 60, max: 160 },
    waist: { min: 50, max: 160 },
    hip: { min: 60, max: 170 },
    shoulder: { min: 30, max: 60 },
    neck: { min: 28, max: 55 },
    sleeveLength: { min: 40, max: 80 },
    garmentLength: { min: 60, max: 145 },
  };

  private readonly CRITICAL = ['chest', 'waist', 'hip'];
  private readonly DUAL_ENTRY_TOLERANCE_CM = 1.5;

  validate(
    values: MeasurementValues,
    source: MeasurementSource,
    confirmValues?: MeasurementValues,
  ): ValidationResult {
    const errors: string[] = [];
    const outlierFlags: ValidationResult['outlierFlags'] = {};

    // 1. Range checks.
    for (const [key, value] of Object.entries(values)) {
      const range = this.RANGES[key];
      if (!range) continue;
      if (value < range.min) outlierFlags[key] = 'low';
      else if (value > range.max) outlierFlags[key] = 'high';
    }

    // 2. Ratio plausibility (waist shouldn't exceed chest by a lot; hip vs waist).
    if (values.chest && values.waist && values.waist > values.chest * 1.35) {
      outlierFlags.waist = 'implausible';
    }
    if (values.hip && values.waist && values.hip < values.waist * 0.7) {
      outlierFlags.hip = 'implausible';
    }

    // 3. Dual-entry confirmation for critical measurements.
    let missingConfirmations = 0;
    for (const key of this.CRITICAL) {
      if (values[key] === undefined) continue;
      const confirm = confirmValues?.[key];
      if (confirm === undefined) {
        missingConfirmations++;
        continue;
      }
      if (Math.abs(confirm - values[key]) > this.DUAL_ENTRY_TOLERANCE_CM) {
        errors.push(
          `${cap(key)}: the two entries differ by more than ${this.DUAL_ENTRY_TOLERANCE_CM}cm — please re-measure.`,
        );
      }
    }

    // 4. Confidence score.
    let confidence = 100;
    confidence -= Object.keys(outlierFlags).length * 15;
    confidence -= missingConfirmations * 10;
    if (source === 'manual') confidence -= 10;
    if (source === 'questionnaire') confidence -= 20;
    confidence = Math.max(0, Math.min(100, confidence));

    return { errors, outlierFlags, confidence };
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

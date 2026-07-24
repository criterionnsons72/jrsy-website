import { Injectable } from '@nestjs/common';

export type FitPreference = 'slim' | 'regular' | 'relaxed';
export type FabricStretch = 'stretch' | 'non_stretch';
export type MeasurementValues = Record<string, number>; // centimetres

export interface FormulaInputs {
  fit: FitPreference;
  stretch: FabricStretch;
  shrinkageRate?: number; // fraction, e.g. 0.03 for 3% cotton
  productionToleranceCm?: number; // default 0.5
}

export interface FormulaResult {
  garment: MeasurementValues; // body + ease + fit + stretch
  final: MeasurementValues; // garment + shrinkage + tolerance
}

/**
 * Implements the Stage 1 formula, per measurement key:
 *
 *   Body + Ease + Fit preference + Fabric stretch + Shrinkage + Production tolerance
 *   = Final garment measurement
 *
 * Pure and deterministic — the single source of truth for turning body
 * measurements into what the workshop cuts to. Body, garment and final are
 * kept distinct (never merged).
 */
@Injectable()
export class MeasurementFormulaService {
  // Base ease allowance per key (cm).
  private readonly EASE: MeasurementValues = {
    chest: 10,
    waist: 8,
    hip: 10,
    shoulder: 1.5,
    neck: 1,
    sleeveLength: 0,
    garmentLength: 0,
  };

  // Fit adjustment added to ease (cm), applied to girth keys.
  private readonly FIT_DELTA: Record<FitPreference, number> = {
    slim: -2,
    regular: 0,
    relaxed: 3,
  };

  private readonly GIRTH_KEYS = new Set(['chest', 'waist', 'hip']);

  compute(body: MeasurementValues, inputs: FormulaInputs): FormulaResult {
    const stretchFactor = inputs.stretch === 'stretch' ? 0.6 : 1; // stretch fabric needs less ease
    const shrinkageRate = inputs.shrinkageRate ?? 0;
    const tolerance = inputs.productionToleranceCm ?? 0.5;

    const garment: MeasurementValues = {};
    const final: MeasurementValues = {};

    for (const [key, bodyValue] of Object.entries(body)) {
      const baseEase = this.EASE[key] ?? 0;
      const fitDelta = this.GIRTH_KEYS.has(key) ? this.FIT_DELTA[inputs.fit] : 0;
      const ease = (baseEase + fitDelta) * stretchFactor;

      const garmentValue = round1(bodyValue + ease);
      const shrinkage = garmentValue * shrinkageRate;
      const finalValue = round1(garmentValue + shrinkage + tolerance);

      garment[key] = garmentValue;
      final[key] = finalValue;
    }

    return { garment, final };
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

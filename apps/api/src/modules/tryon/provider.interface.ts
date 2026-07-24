/**
 * Provider-agnostic Virtual Try-On & Body Scan contracts.
 *
 * The application depends ONLY on these interfaces — no vendor SDK is imported
 * in domain code. A mock implementation ships first; a real vendor (PICTOFiT,
 * 3DLOOK, Bold Metrics, …) is bound later purely by configuration, with zero
 * changes to the core. Every provider call reports a cost for vendor analytics.
 */

export interface TryOnInput {
  productId?: string;
  inputAssetKey: string; // object-storage key of the uploaded image
  // Short-lived URLs a real provider fetches (the person photo + the garment).
  humanImageUrl?: string;
  garmentImageUrl?: string;
  garmentDescription?: string;
  // Lightweight metadata used for the quality check (no image bytes here).
  imageMeta?: { width?: number; height?: number; hasFullBody?: boolean };
}

export type ProviderJobStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ProviderJobRef {
  providerRef: string;
}

export interface TryOnProviderResult {
  status: ProviderJobStatus;
  resultAssetKey?: string; // already in our storage (mock)
  resultUrl?: string; // remote URL (real provider); the service persists it
  costCents: number;
  error?: string;
}

export interface TryOnProvider {
  readonly name: string;
  createTryOnJob(input: TryOnInput): Promise<ProviderJobRef>;
  getTryOnStatus(ref: ProviderJobRef): Promise<ProviderJobStatus>;
  getTryOnResult(ref: ProviderJobRef): Promise<TryOnProviderResult>;
  deleteTryOnAssets(ref: ProviderJobRef): Promise<void>;
}

export interface BodyScanInput {
  frontAssetKey: string;
  sideAssetKey?: string;
}

export interface BodyMeasurements {
  values: Record<string, number>; // cm
  confidence: number; // 0-100
  costCents: number;
}

export interface BodyScanProvider {
  readonly name: string;
  startBodyScan(input: BodyScanInput): Promise<ProviderJobRef>;
  getBodyMeasurements(ref: ProviderJobRef): Promise<BodyMeasurements>;
}

export const TRYON_PROVIDER = Symbol('TRYON_PROVIDER');
export const BODYSCAN_PROVIDER = Symbol('BODYSCAN_PROVIDER');

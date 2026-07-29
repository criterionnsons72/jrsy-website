import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';
import type {
  ProviderJobRef,
  ProviderJobStatus,
  TryOnInput,
  TryOnProvider,
  TryOnProviderResult,
} from '../provider.interface';

/**
 * Real 2D virtual try-on via Replicate (e.g. IDM-VTON / OOTDiffusion).
 *
 * The model reference and its input field names come from the chosen model's
 * card on replicate.com — set them via env so you can switch models without a
 * code change:
 *   REPLICATE_API_TOKEN     (required)
 *   REPLICATE_TRYON_VERSION (the model version id — from the model's API tab)
 *   REPLICATE_TRYON_MODEL   (optional "owner/name" label, for logs)
 *
 * Result is a STYLE PREVIEW (look only), never a guaranteed fit — the same
 * disclaimer the rest of the product enforces.
 */
@Injectable()
export class ReplicateTryOnProvider implements TryOnProvider {
  readonly name = 'replicate';
  private readonly logger = new Logger(ReplicateTryOnProvider.name);
  private readonly client: Replicate;
  private readonly version?: string;
  private readonly modelSlug?: string;
  private resolvedVersion?: string;

  constructor(config: ConfigService) {
    const token = config.getOrThrow<string>('REPLICATE_API_TOKEN');
    // Either pin an exact version id, or give a model "owner/name" and we
    // resolve its latest version on first use (easier — no hash to copy).
    this.version = config.get<string>('REPLICATE_TRYON_VERSION') || undefined;
    this.modelSlug = config.get<string>('REPLICATE_TRYON_MODEL') || undefined;
    if (!this.version && !this.modelSlug) {
      throw new Error(
        'Set REPLICATE_TRYON_VERSION (a version id) or REPLICATE_TRYON_MODEL ("owner/name").',
      );
    }
    this.client = new Replicate({ auth: token });
  }

  /** Resolve the version id — from the pinned value or the model's latest. */
  private async resolveVersion(): Promise<string> {
    if (this.version) return this.version;
    if (this.resolvedVersion) return this.resolvedVersion;
    const [owner, name] = (this.modelSlug ?? '').split('/');
    if (!owner || !name) {
      throw new Error('REPLICATE_TRYON_MODEL must look like "owner/name", e.g. cuuupid/idm-vton.');
    }
    const model = await this.client.models.get(owner, name);
    const id = model.latest_version?.id;
    if (!id) {
      throw new Error(`Could not find a version for Replicate model "${this.modelSlug}".`);
    }
    this.logger.log(`Resolved ${this.modelSlug} to version ${id}.`);
    this.resolvedVersion = id;
    return id;
  }

  async createTryOnJob(input: TryOnInput): Promise<ProviderJobRef> {
    if (!input.humanImageUrl || !input.garmentImageUrl) {
      throw new Error('Replicate try-on needs both a person photo and a garment image URL.');
    }
    // Field names below match IDM-VTON; adjust for a different model's schema.
    const prediction = await this.client.predictions.create({
      version: await this.resolveVersion(),
      input: {
        human_img: input.humanImageUrl,
        garm_img: input.garmentImageUrl,
        garment_des: input.garmentDescription ?? 'garment',
      },
    });
    return { providerRef: prediction.id };
  }

  async getTryOnStatus(ref: ProviderJobRef): Promise<ProviderJobStatus> {
    const p = await this.client.predictions.get(ref.providerRef);
    return this.map(p.status);
  }

  async getTryOnResult(ref: ProviderJobRef): Promise<TryOnProviderResult> {
    // Poll until the prediction reaches a terminal state.
    const deadline = Date.now() + 120_000;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const p = await this.client.predictions.get(ref.providerRef);
      const status = this.map(p.status);
      if (status === 'ready') {
        const url = Array.isArray(p.output) ? String(p.output[0]) : String(p.output);
        return { status: 'ready', resultUrl: url, costCents: this.estimateCost() };
      }
      if (status === 'failed') {
        return {
          status: 'failed',
          costCents: 0,
          error: p.error ? String(p.error) : 'Prediction failed.',
        };
      }
      if (Date.now() > deadline) {
        return { status: 'failed', costCents: 0, error: 'Prediction timed out.' };
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  async deleteTryOnAssets(): Promise<void> {
    // Replicate outputs expire on their side; our own copies are deleted by the service.
  }

  private map(status: string): ProviderJobStatus {
    switch (status) {
      case 'succeeded':
        return 'ready';
      case 'failed':
      case 'canceled':
        return 'failed';
      case 'processing':
        return 'processing';
      default:
        return 'queued';
    }
  }

  private estimateCost(): number {
    // Rough per-generation estimate in cents for analytics; refine from billing.
    return 8;
  }
}

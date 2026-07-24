import { Injectable } from '@nestjs/common';
import type {
  ProviderJobRef,
  ProviderJobStatus,
  TryOnInput,
  TryOnProvider,
  TryOnProviderResult,
} from '../provider.interface';

/**
 * Mock Try-On provider. Simulates a vendor without any external call, GPU, or
 * cost — used until a real provider is approved and connected. Deterministic:
 * it "fails" only when the input is clearly unusable, so tests are stable.
 */
@Injectable()
export class MockTryOnProvider implements TryOnProvider {
  readonly name = 'mock';

  async createTryOnJob(input: TryOnInput): Promise<ProviderJobRef> {
    return { providerRef: `mock_${input.inputAssetKey}` };
  }

  async getTryOnStatus(): Promise<ProviderJobStatus> {
    return 'ready';
  }

  async getTryOnResult(ref: ProviderJobRef): Promise<TryOnProviderResult> {
    // A real provider would return a generated image; the mock returns a
    // deterministic placeholder result key and a nominal simulated cost.
    return {
      status: 'ready',
      resultAssetKey: `${ref.providerRef}_result.png`,
      costCents: 5, // simulated per-generation cost for analytics
    };
  }

  async deleteTryOnAssets(): Promise<void> {
    // Nothing to delete for the mock; the app clears its own asset references.
    return;
  }
}

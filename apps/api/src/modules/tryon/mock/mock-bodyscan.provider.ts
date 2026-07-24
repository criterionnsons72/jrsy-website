import { Injectable } from '@nestjs/common';
import type {
  BodyMeasurements,
  BodyScanInput,
  BodyScanProvider,
  ProviderJobRef,
} from '../provider.interface';

/**
 * Mock Body Scan provider — returns plausible measurements with a confidence
 * score, standing in for a vendor (3DLOOK / Bold Metrics) until one is approved.
 */
@Injectable()
export class MockBodyScanProvider implements BodyScanProvider {
  readonly name = 'mock';

  async startBodyScan(input: BodyScanInput): Promise<ProviderJobRef> {
    return { providerRef: `mockscan_${input.frontAssetKey}` };
  }

  async getBodyMeasurements(): Promise<BodyMeasurements> {
    return {
      values: { chest: 100, waist: 88, hip: 102, shoulder: 46, sleeveLength: 62 },
      confidence: 74, // mid confidence → app should offer manual fallback
      costCents: 20,
    };
  }
}

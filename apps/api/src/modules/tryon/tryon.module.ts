import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TryOnController, TryOnAnalyticsController } from './tryon.controller';
import { TryOnService } from './tryon.service';
import { TryOnProcessor } from './tryon.processor';
import { QualityCheckService } from './quality-check.service';
import { MockTryOnProvider } from './mock/mock-tryon.provider';
import { MockBodyScanProvider } from './mock/mock-bodyscan.provider';
import {
  BODYSCAN_PROVIDER,
  TRYON_PROVIDER,
  type BodyScanProvider,
  type TryOnProvider,
} from './provider.interface';

/**
 * Providers are bound by configuration. Only the mock is available today; when
 * a real vendor is approved, add its implementation and select it by env
 * (TRYON_PROVIDER / BODYSCAN_PROVIDER) — no domain code changes.
 */
@Module({
  controllers: [TryOnController, TryOnAnalyticsController],
  providers: [
    TryOnService,
    TryOnProcessor,
    QualityCheckService,
    MockTryOnProvider,
    MockBodyScanProvider,
    {
      provide: TRYON_PROVIDER,
      inject: [ConfigService, MockTryOnProvider],
      useFactory: (config: ConfigService, mock: MockTryOnProvider): TryOnProvider => {
        const name = config.get<string>('TRYON_PROVIDER', 'mock');
        switch (name) {
          case 'mock':
            return mock;
          // case 'pictofit': return new PictofitProvider(...) — added when approved
          default:
            return mock;
        }
      },
    },
    {
      provide: BODYSCAN_PROVIDER,
      inject: [ConfigService, MockBodyScanProvider],
      useFactory: (config: ConfigService, mock: MockBodyScanProvider): BodyScanProvider => {
        const name = config.get<string>('BODYSCAN_PROVIDER', 'mock');
        switch (name) {
          case 'mock':
            return mock;
          default:
            return mock;
        }
      },
    },
  ],
})
export class TryOnModule {}

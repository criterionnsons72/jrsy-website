import { Injectable } from '@nestjs/common';
import type { ChargeInput, ChargeResult, PaymentProvider } from './payment.interface';

/**
 * Mock payment provider — no real charge. Card is treated as paid immediately;
 * cash-on-delivery is pending until fulfilment. Deterministic for tests.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async charge(input: ChargeInput): Promise<ChargeResult> {
    return {
      status: input.method === 'cod' ? 'pending' : 'paid',
      providerRef: `mockpay_${input.orderNumber}`,
    };
  }

  async refund(): Promise<void> {
    return;
  }
}

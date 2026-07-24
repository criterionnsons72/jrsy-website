/**
 * Provider-agnostic payment contract. The mock ships first; a real gateway
 * (Stripe / local / COD handler) is bound by config with no domain changes.
 */
export interface ChargeInput {
  amountCents: number;
  currency: string;
  method: 'card' | 'cod';
  orderNumber: string;
}

export interface ChargeResult {
  status: 'paid' | 'pending' | 'failed';
  providerRef: string;
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(providerRef: string): Promise<void>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

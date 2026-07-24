import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { MockPaymentProvider } from './mock-payment.provider';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment.interface';

@Module({
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, MockPaymentProvider],
      useFactory: (config: ConfigService, mock: MockPaymentProvider): PaymentProvider => {
        const name = config.get<string>('PAYMENT_PROVIDER', 'mock');
        switch (name) {
          case 'mock':
            return mock;
          // case 'stripe': return new StripeProvider(...) — added when approved
          default:
            return mock;
        }
      },
    },
  ],
})
export class CheckoutModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/identity/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { ConfiguratorModule } from './modules/configurator/configurator.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MeasurementModule } from './modules/measurement/measurement.module';
import { TryOnModule } from './modules/tryon/tryon.module';
import { ProductionModule } from './modules/production/production.module';
import { AdminModule } from './modules/admin/admin.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Global rate limiting (per IP). Auth routes tighten this further.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    // Stage 7 — Ecommerce Core:
    CatalogModule,
    CartModule,
    OrderModule,
    // Stage 8 — Customization Engine:
    ConfiguratorModule,
    PricingModule,
    // Stage 9 — Measurement & Sizing:
    MeasurementModule,
    // Stage 10 — Virtual Try-On (mock provider):
    TryOnModule,
    // Stage 11 — Order & Production:
    ProductionModule,
    // Stage 12 — Admin & Reporting:
    AdminModule,
    // Checkout & payment (adapter, mock first):
    CheckoutModule,
    // Stage 13+ (security/QA/perf, deployment) follow.
  ],
  providers: [
    // Apply rate limiting globally.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

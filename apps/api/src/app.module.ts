import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
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
    // Stage 10+ modules (tryon, checkout, production, documents…) go here.
  ],
})
export class AppModule {}

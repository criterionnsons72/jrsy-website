import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsController } from '../analytics/analytics.controller';

@Module({
  controllers: [AdminController, AnalyticsController],
  providers: [AdminService, AnalyticsService],
  exports: [AdminService, AnalyticsService],
})
export class AdminModule {}

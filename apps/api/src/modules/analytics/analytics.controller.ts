import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';

class TrackDto {
  @IsString() type!: string;
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsObject() props?: Record<string, unknown>;
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Public event ingestion (product views, funnel steps). */
  @Post('events')
  track(@Body() dto: TrackDto, @Req() req: Request) {
    const userId = (req.user as { id?: string } | undefined)?.id;
    return this.analytics.track({ type: dto.type, sessionId: dto.sessionId, props: dto.props, userId });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'finance', 'production_manager')
  @Get('report')
  report() {
    return this.analytics.report();
  }
}

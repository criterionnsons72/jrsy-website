import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TryOnService } from './tryon.service';
import { BodyScanDto, ConsentDto, CreateTryOnDto } from './dto/create-tryon.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import type { AuthenticatedUser } from '../identity/strategies/jwt.strategy';

function uid(req: Request): string {
  return (req.user as AuthenticatedUser).id;
}

@ApiTags('tryon')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tryon')
export class TryOnController {
  constructor(private readonly tryon: TryOnService) {}

  @Post('consent')
  consent(@Req() req: Request, @Body() dto: ConsentDto) {
    return this.tryon.grantConsent(uid(req), dto.purpose, req.ip);
  }

  @Post('jobs')
  create(@Req() req: Request, @Body() dto: CreateTryOnDto) {
    return this.tryon.createJob(uid(req), dto);
  }

  @Get('jobs')
  list(@Req() req: Request) {
    return this.tryon.listJobs(uid(req));
  }

  @Get('jobs/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.tryon.getJob(uid(req), id);
  }

  @Delete('jobs/:id/assets')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.tryon.deleteAssets(uid(req), id);
  }

  @Post('body-scan')
  scan(@Req() req: Request, @Body() dto: BodyScanDto) {
    return this.tryon.startBodyScan(uid(req), dto);
  }
}

@ApiTags('tryon')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'finance')
@Controller('tryon/analytics')
export class TryOnAnalyticsController {
  constructor(private readonly tryon: TryOnService) {}

  @Get()
  analytics() {
    return this.tryon.analytics();
  }
}

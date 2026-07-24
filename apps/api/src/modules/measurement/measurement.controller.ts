import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { BodyProfileService } from './body-profile.service';
import { MeasurementService } from './measurement.service';
import { MeasurementReviewService } from './measurement-review.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { AddMeasurementDto } from './dto/add-measurement.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import type { AuthenticatedUser } from '../identity/strategies/jwt.strategy';

function userId(req: Request): string {
  return (req.user as AuthenticatedUser).id;
}

@ApiTags('measurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('body-profiles')
export class BodyProfileController {
  constructor(
    private readonly profiles: BodyProfileService,
    private readonly measurements: MeasurementService,
  ) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateProfileDto) {
    return this.profiles.create(userId(req), dto);
  }

  @Get()
  list(@Req() req: Request) {
    return this.profiles.list(userId(req));
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.profiles.get(userId(req), id);
  }

  @Post(':id/measurements')
  addMeasurement(@Req() req: Request, @Param('id') id: string, @Body() dto: AddMeasurementDto) {
    return this.measurements.add(userId(req), id, dto);
  }
}

@ApiTags('measurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('measurements')
export class MeasurementController {
  constructor(private readonly measurements: MeasurementService) {}

  @Post(':id/submit-review')
  submit(@Req() req: Request, @Param('id') id: string) {
    return this.measurements.submitForReview(userId(req), id);
  }
}

@ApiTags('measurement-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tailor', 'measurement_reviewer', 'admin', 'super_admin')
@Controller('measurement-reviews')
export class MeasurementReviewController {
  constructor(private readonly reviews: MeasurementReviewService) {}

  @Get()
  pending() {
    return this.reviews.listPending();
  }

  @Patch(':id')
  decide(@Req() req: Request, @Param('id') id: string, @Body() dto: ReviewDecisionDto) {
    return this.reviews.decide(id, userId(req), dto.approve, dto.notes);
  }
}

import { Module } from '@nestjs/common';
import {
  BodyProfileController,
  MeasurementController,
  MeasurementReviewController,
} from './measurement.controller';
import { BodyProfileService } from './body-profile.service';
import { MeasurementService } from './measurement.service';
import { MeasurementReviewService } from './measurement-review.service';
import { MeasurementFormulaService } from './measurement-formula.service';
import { MeasurementValidationService } from './measurement-validation.service';

@Module({
  controllers: [BodyProfileController, MeasurementController, MeasurementReviewController],
  providers: [
    BodyProfileService,
    MeasurementService,
    MeasurementReviewService,
    MeasurementFormulaService,
    MeasurementValidationService,
  ],
  exports: [MeasurementFormulaService, MeasurementValidationService],
})
export class MeasurementModule {}

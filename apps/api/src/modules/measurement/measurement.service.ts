import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BodyProfileService } from './body-profile.service';
import { MeasurementValidationService } from './measurement-validation.service';
import { MeasurementFormulaService, type FitPreference, type FabricStretch } from './measurement-formula.service';
import { AddMeasurementDto } from './dto/add-measurement.dto';

@Injectable()
export class MeasurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: BodyProfileService,
    private readonly validation: MeasurementValidationService,
    private readonly formula: MeasurementFormulaService,
  ) {}

  async add(userId: string, profileId: string, dto: AddMeasurementDto) {
    await this.profiles.assertOwned(userId, profileId);

    const result = this.validation.validate(dto.values, dto.source, dto.confirmValues);
    if (result.errors.length > 0) {
      throw new BadRequestException({ message: 'Measurement validation failed', errors: result.errors });
    }

    const measurement = await this.prisma.measurement.create({
      data: {
        profileId,
        kind: dto.kind,
        source: dto.source,
        values: dto.values as Prisma.InputJsonValue,
        outlierFlags: result.outlierFlags as Prisma.InputJsonValue,
        confidence: result.confidence,
      },
    });

    return { measurement, validation: result };
  }

  /**
   * Compute garment + final production measurements from a body measurement,
   * using the Stage 1 formula. Does not store — returned for review/preview.
   */
  async computeFinal(
    userId: string,
    measurementId: string,
    opts: { fit: FitPreference; stretch: FabricStretch; shrinkageRate?: number },
  ) {
    const measurement = await this.getOwned(userId, measurementId);
    if (measurement.kind !== 'body') {
      throw new BadRequestException('Final measurements are computed from a body measurement.');
    }
    const body = measurement.values as Record<string, number>;
    return this.formula.compute(body, opts);
  }

  async submitForReview(userId: string, measurementId: string) {
    const measurement = await this.getOwned(userId, measurementId);
    if (measurement.lockedAt) {
      throw new BadRequestException('This measurement is already locked.');
    }
    return this.prisma.measurementReview.create({
      data: { measurementId: measurement.id, status: 'pending' },
    });
  }

  private async getOwned(userId: string, measurementId: string) {
    const measurement = await this.prisma.measurement.findUnique({
      where: { id: measurementId },
      include: { profile: { include: { customer: true } } },
    });
    if (!measurement) throw new NotFoundException('Measurement not found.');
    if (measurement.profile.customer.userId !== userId) {
      throw new ForbiddenException('Not your measurement.');
    }
    return measurement;
  }
}

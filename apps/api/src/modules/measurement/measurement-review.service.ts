import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Tailor / Measurement-Reviewer queue. Approving a measurement LOCKS it
 * (sets lockedAt) and marks the profile tailor-verified — the gate before
 * production can begin.
 */
@Injectable()
export class MeasurementReviewService {
  constructor(private readonly prisma: PrismaService) {}

  listPending() {
    return this.prisma.measurementReview.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        measurement: {
          include: { profile: { select: { id: true, label: true, fitPreference: true } } },
        },
      },
    });
  }

  async decide(reviewId: string, reviewerId: string, approve: boolean, notes?: string) {
    const review = await this.prisma.measurementReview.findUnique({
      where: { id: reviewId },
      include: { measurement: true },
    });
    if (!review) throw new NotFoundException('Review not found.');
    if (review.status !== 'pending') {
      throw new BadRequestException('This review has already been decided.');
    }
    if (!approve && !notes) {
      throw new BadRequestException('A note is required when rejecting.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.measurementReview.update({
        where: { id: reviewId },
        data: {
          status: approve ? 'approved' : 'rejected',
          reviewerId,
          notes: notes ?? null,
          decidedAt: new Date(),
        },
      });

      if (approve) {
        await tx.measurement.update({
          where: { id: review.measurementId },
          data: { lockedAt: new Date() },
        });
        await tx.bodyProfile.update({
          where: { id: review.measurement.profileId },
          data: { verifiedByTailor: true },
        });
      }
      return updated;
    });
  }
}

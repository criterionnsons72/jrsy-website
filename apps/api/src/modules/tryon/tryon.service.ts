import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QualityCheckService, type ImageMeta } from './quality-check.service';
import {
  BODYSCAN_PROVIDER,
  TRYON_PROVIDER,
  type BodyScanProvider,
  type TryOnProvider,
} from './provider.interface';

const MAX_ATTEMPTS = 3;

@Injectable()
export class TryOnService {
  private readonly logger = new Logger(TryOnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quality: QualityCheckService,
    @Inject(TRYON_PROVIDER) private readonly tryonProvider: TryOnProvider,
    @Inject(BODYSCAN_PROVIDER) private readonly scanProvider: BodyScanProvider,
  ) {}

  private async customerId(userId: string): Promise<string> {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('Only customers can use try-on.');
    return customer.id;
  }

  /** Record explicit consent for a sensitive-image purpose. */
  async grantConsent(userId: string, purpose: 'tryon_image' | 'body_scan', ip?: string) {
    return this.prisma.consentRecord.create({
      data: { userId, purpose, version: 'v1', ip: ip ?? null },
    });
  }

  private async requireConsent(userId: string, purpose: string): Promise<string> {
    const consent = await this.prisma.consentRecord.findFirst({
      where: { userId, purpose, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
    });
    if (!consent) {
      throw new ForbiddenException(`Explicit consent required for ${purpose}.`);
    }
    return consent.id;
  }

  /**
   * Try-on workflow: consent → quality check → create job (queued) → background
   * processing via the provider adapter → result stored → ready. The result is
   * a STYLE PREVIEW (look only), never a fit guarantee.
   */
  async createJob(
    userId: string,
    input: { productId?: string; inputAssetKey: string; imageMeta?: ImageMeta },
  ) {
    const customerId = await this.customerId(userId);
    const consentId = await this.requireConsent(userId, 'tryon_image');

    const q = this.quality.check(input.imageMeta);
    if (!q.ok) {
      throw new BadRequestException({ message: 'Image quality check failed', reasons: q.reasons });
    }

    const job = await this.prisma.tryOnJob.create({
      data: {
        customerId,
        productId: input.productId ?? null,
        provider: this.tryonProvider.name,
        status: 'queued',
        inputAssetKey: input.inputAssetKey,
        consentId,
      },
    });

    // Background processing (a BullMQ worker in production; in-process for the mock).
    void this.processJob(job.id, input);

    return { id: job.id, status: job.status, disclaimer: this.disclaimer() };
  }

  private async processJob(
    jobId: string,
    input: { productId?: string; inputAssetKey: string; imageMeta?: ImageMeta },
  ): Promise<void> {
    try {
      await this.prisma.tryOnJob.update({
        where: { id: jobId },
        data: { status: 'processing', attempts: { increment: 1 } },
      });

      const ref = await this.tryonProvider.createTryOnJob({
        productId: input.productId,
        inputAssetKey: input.inputAssetKey,
        imageMeta: input.imageMeta,
      });
      const result = await this.tryonProvider.getTryOnResult(ref);

      if (result.status !== 'ready' || !result.resultAssetKey) {
        throw new Error(result.error ?? 'Provider did not return a result.');
      }

      await this.prisma.tryOnJob.update({
        where: { id: jobId },
        data: {
          status: 'ready',
          resultAssetKey: result.resultAssetKey,
          costCents: result.costCents,
          error: null,
        },
      });
    } catch (err) {
      const job = await this.prisma.tryOnJob.findUnique({ where: { id: jobId } });
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (job && job.attempts < MAX_ATTEMPTS) {
        this.logger.warn(`Try-on job ${jobId} failed (attempt ${job.attempts}), retrying: ${message}`);
        void this.processJob(jobId, input);
      } else {
        this.logger.error(`Try-on job ${jobId} failed permanently: ${message}`);
        await this.prisma.tryOnJob.update({
          where: { id: jobId },
          data: { status: 'failed', error: message },
        });
      }
    }
  }

  async getJob(userId: string, jobId: string) {
    const customerId = await this.customerId(userId);
    const job = await this.prisma.tryOnJob.findFirst({ where: { id: jobId, customerId } });
    if (!job) throw new NotFoundException('Try-on job not found.');
    // A real deployment returns a signed, short-lived URL rather than the key.
    return {
      id: job.id,
      status: job.status,
      resultAssetKey: job.status === 'ready' ? job.resultAssetKey : null,
      error: job.error,
      disclaimer: this.disclaimer(),
    };
  }

  async listJobs(userId: string) {
    const customerId = await this.customerId(userId);
    return this.prisma.tryOnJob.findMany({
      where: { customerId, status: { not: 'deleted' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, productId: true, createdAt: true, costCents: true },
    });
  }

  /** Secure deletion of the original image and the generated result. */
  async deleteAssets(userId: string, jobId: string) {
    const customerId = await this.customerId(userId);
    const job = await this.prisma.tryOnJob.findFirst({ where: { id: jobId, customerId } });
    if (!job) throw new NotFoundException('Try-on job not found.');

    await this.tryonProvider.deleteTryOnAssets({ providerRef: `mock_${job.inputAssetKey}` });
    // In production: delete the objects from storage here, then null the refs.

    await this.prisma.tryOnJob.update({
      where: { id: job.id },
      data: {
        status: 'deleted',
        inputAssetKey: null,
        resultAssetKey: null,
        deletedAt: new Date(),
      },
    });
    return { deleted: true };
  }

  /** Body scan (mock) — used for size recommendation / initial measurements. */
  async startBodyScan(userId: string, input: { frontAssetKey: string; sideAssetKey?: string }) {
    const customerId = await this.customerId(userId);
    const consentId = await this.requireConsent(userId, 'body_scan');

    const job = await this.prisma.bodyScanJob.create({
      data: { customerId, provider: this.scanProvider.name, status: 'processing', consentId },
    });

    const ref = await this.scanProvider.startBodyScan(input);
    const measurements = await this.scanProvider.getBodyMeasurements(ref);

    return this.prisma.bodyScanJob.update({
      where: { id: job.id },
      data: {
        status: 'ready',
        result: { values: measurements.values, confidence: measurements.confidence },
        costCents: measurements.costCents,
      },
    });
  }

  /** Vendor cost + usage analytics (admin). */
  async analytics() {
    const [byStatus, cost] = await Promise.all([
      this.prisma.tryOnJob.groupBy({ by: ['status'], _count: true }),
      this.prisma.tryOnJob.aggregate({ _sum: { costCents: true } }),
    ]);
    return {
      jobsByStatus: byStatus,
      totalCostCents: cost._sum.costCents ?? 0,
    };
  }

  private disclaimer(): string {
    return 'Style Preview shows look only — not a guaranteed fit. For fit, use measurements & tailor review.';
  }
}

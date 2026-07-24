import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QUEUES, DEFAULT_JOB_OPTS } from '../queue/queue.constants';
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
    private readonly storage: StorageService,
    @InjectQueue(QUEUES.tryon) private readonly queue: Queue,
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

    // Enqueue for a background worker; fall back to inline if Redis is down.
    try {
      await this.queue.add('process', { jobId: job.id }, DEFAULT_JOB_OPTS);
    } catch {
      this.logger.warn('Queue unavailable — processing try-on inline.');
      void this.runInline(job.id);
    }

    return { id: job.id, status: job.status, disclaimer: this.disclaimer() };
  }

  /** Core processing step. Throws on failure so the queue can retry it. */
  async processOnce(jobId: string): Promise<void> {
    const job = await this.prisma.tryOnJob.findUnique({ where: { id: jobId } });
    if (!job || job.status === 'deleted') return;

    await this.prisma.tryOnJob.update({
      where: { id: jobId },
      data: { status: 'processing', attempts: { increment: 1 } },
    });

    const ref = await this.tryonProvider.createTryOnJob({
      productId: job.productId ?? undefined,
      inputAssetKey: job.inputAssetKey ?? '',
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
  }

  /** Mark a job permanently failed (called by the worker after its retries). */
  async markFailed(jobId: string, message: string): Promise<void> {
    this.logger.error(`Try-on job ${jobId} failed permanently: ${message}`);
    await this.prisma.tryOnJob.update({
      where: { id: jobId },
      data: { status: 'failed', error: message },
    });
  }

  /** Fallback when no queue: retry inline up to MAX_ATTEMPTS. */
  private async runInline(jobId: string): Promise<void> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await this.processOnce(jobId);
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (attempt >= MAX_ATTEMPTS) {
          await this.markFailed(jobId, message);
        } else {
          this.logger.warn(`Inline try-on ${jobId} attempt ${attempt} failed: ${message}`);
        }
      }
    }
  }

  async getJob(userId: string, jobId: string) {
    const customerId = await this.customerId(userId);
    const job = await this.prisma.tryOnJob.findFirst({ where: { id: jobId, customerId } });
    if (!job) throw new NotFoundException('Try-on job not found.');

    // Return a signed, short-lived view URL for the result (never a raw key/public URL).
    let resultUrl: string | null = null;
    if (job.status === 'ready' && job.resultAssetKey && this.storage.configured) {
      resultUrl = await this.storage.presignView(job.resultAssetKey);
    }

    return {
      id: job.id,
      status: job.status,
      resultUrl,
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
    // Securely delete the objects from storage, then null the refs.
    await this.storage.deleteObject(job.inputAssetKey);
    await this.storage.deleteObject(job.resultAssetKey);

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

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../queue/queue.constants';
import { TryOnService } from './tryon.service';

/**
 * Background worker for try-on jobs. BullMQ handles retries/backoff (job opts);
 * when a job exhausts its attempts we mark the DB record failed.
 */
@Processor(QUEUES.tryon)
export class TryOnProcessor extends WorkerHost {
  private readonly logger = new Logger(TryOnProcessor.name);

  constructor(private readonly tryon: TryOnService) {
    super();
  }

  async process(job: Job<{ jobId: string }>): Promise<void> {
    await this.tryon.processOnce(job.data.jobId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ jobId: string }>, err: Error): Promise<void> {
    const maxed = job.attemptsMade >= (job.opts.attempts ?? 1);
    this.logger.warn(
      `Try-on job ${job.data.jobId} attempt ${job.attemptsMade} failed: ${err.message}`,
    );
    if (maxed) {
      await this.tryon.markFailed(job.data.jobId, err.message);
    }
  }
}

import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUES } from './queue.constants';

/**
 * Background-job infrastructure (BullMQ + Redis). Registers the shared Redis
 * connection and the queues. Producers inject a queue with @InjectQueue; the
 * workers (processors) live in their feature modules.
 *
 * If Redis is unreachable, producers fall back to inline processing (see the
 * try-on service) so the app still works in environments without Redis.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get<string>('REDIS_URL', 'redis://localhost:6379'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            // Managed Redis (e.g. Railway) requires the credentials from the URL.
            username: url.username ? decodeURIComponent(url.username) : undefined,
            password: url.password ? decodeURIComponent(url.password) : undefined,
            // Support TLS endpoints (rediss://).
            ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
            // Don't block boot when Redis is down; retry in the background.
            maxRetriesPerRequest: null,
            enableOfflineQueue: true,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUES.tryon },
      { name: QUEUES.documents },
      { name: QUEUES.assets },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

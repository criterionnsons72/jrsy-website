/** Names of the background queues. Kept in one place so producers and workers agree. */
export const QUEUES = {
  tryon: 'tryon',
  documents: 'documents',
  assets: 'assets',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

/** Default retry policy: 3 attempts with exponential backoff. */
export const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

import { Queue } from 'bullmq';
import type { JobOptions, Queue as BullQueue } from 'bullmq';

import { parseEnv } from '@portal/config/index';
import type { EmailJobData } from './types';

const env = parseEnv();

type MinimalQueue<T> = Pick<BullQueue<T>, 'add' | 'name'>;

function createQueue<T>(name: string): MinimalQueue<T> {
  if (!env.REDIS_URL) {
    return {
      name,
      async add(_jobName: string, _data: T, _options?: JobOptions) {
        console.warn(`Queue "${name}" skipped because REDIS_URL is not configured.`);
        return undefined as unknown as ReturnType<BullQueue<T>['add']>;
      }
    };
  }

  const baseQueueOptions = {
    connection: { url: env.REDIS_URL },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 500 }
    }
  };

  return new Queue<T>(name, baseQueueOptions);
}

export const emailQueue = createQueue<EmailJobData>('email');

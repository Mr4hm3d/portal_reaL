import { Queue } from 'bullmq';

import { parseEnv } from '@portal/config/index';
import type { EmailJobData } from './types';

const env = parseEnv();

const baseQueueOptions = {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 }
  }
};

export const emailQueue = new Queue<EmailJobData>('email', baseQueueOptions);

import type { JobOptions } from 'bullmq';

import type { EmailJobData } from './types';
import { emailQueue } from './queues';

const defaults: JobOptions = { removeOnComplete: true, removeOnFail: 10, attempts: 3 };

export function enqueueEmail(data: EmailJobData, options?: JobOptions) {
  return emailQueue.add('send-email', data, { ...defaults, ...options });
}

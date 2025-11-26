import { Worker } from 'bullmq';

import { parseEnv } from '@config/index';
import { sendEmail } from '@email/service';
import type { EmailJobData } from '@jobs/index';
import { emailQueue } from '@jobs/index';

const env = parseEnv();

new Worker<EmailJobData>(
  emailQueue.name,
  async (job) => {
    await sendEmail(job.data);
  },
  {
    connection: { url: env.REDIS_URL }
  }
);

if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log('Worker is consuming queues from Redis', env.REDIS_URL);
}

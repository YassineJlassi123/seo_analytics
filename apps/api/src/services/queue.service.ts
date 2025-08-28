import { Queue, Worker, Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { connection } from '@/config/redis.js';
import { runLighthouseAnalysis, generateSeoInsights } from './lighthouse.service.js';
import * as db from '../repositories/lighthouse.repository.js';
import { logger } from '@/utils/logger.js';


export type AnalysisJobData = {
  type: 'scheduled';
  websiteId: string;
  userId: string;
  url: string;
} | {
  type: 'on-demand';
  url: string;
};

const ANALYSIS_QUEUE_NAME = 'seo-analysis-queue';

export const analysisQueue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});


export const scheduleAnalysis = async (websiteId: string, userId: string, url: string, cron: string) => {
  const jobId = `website:${websiteId}`;
  if (!cron) throw new Error(`Invalid cron expression: ${cron}`);

  await analysisQueue.add(jobId, { type: 'scheduled', websiteId, userId, url }, {
    repeat: { pattern: cron },
    jobId,
  });
  logger.info(`Scheduled analysis for ${url} (${cron}) with job ID ${jobId}`);
};

export const removeScheduledAnalysis = async (websiteId: string) => {
  const jobId = `website:${websiteId}`;
  const repeatableJobs = await analysisQueue.getRepeatableJobs();
  const jobToRemove = repeatableJobs.find((job) => job.id === jobId);

  if (jobToRemove) {
    await analysisQueue.removeRepeatableByKey(jobToRemove.key);
    logger.info(`Removed scheduled analysis for job ID ${jobId}`);
  } else {
    logger.warn(`Could not find scheduled job with ID ${jobId} to remove.`);
  }
};

export const requestOnDemandAnalysis = async (url: string) => {
  const jobId = randomUUID();
  const job = await analysisQueue.add('on-demand-analysis', { type: 'on-demand', url }, {
    jobId,
    priority: 1, // High priority
  });
  return job;
};


const worker = new Worker<AnalysisJobData>(
  ANALYSIS_QUEUE_NAME,
  async (job: Job<AnalysisJobData>) => {
    const { data } = job;

    if (!data.type) {
      logger.warn(`Skipping job ${job.id} with undefined type.`);
      return;
    }

    const url = data.url;

    logger.info(`Starting analysis for ${url} (Job ID: ${job.id}, Type: ${data.type}, Attempt: ${job.attemptsMade + 1})`);

    try {
      const report = await runLighthouseAnalysis(url);

      if (data.type === 'scheduled') {
        await db.saveReport({ websiteId: data.websiteId, userId: data.userId, url, ...report });
        logger.info(`Successfully completed scheduled analysis for ${url} (Job ID: ${job.id})`);
      } else {
        const insights = generateSeoInsights(report);
        const result = {
          report: {
            ...report,
            rawReport: undefined,
          },
          insights,
          saved: false,
        };
        await connection.setex(`result:${job.id}`, 600, JSON.stringify(result));
        logger.info(`Successfully completed on-demand analysis for ${url} (Job ID: ${job.id})`);
      }
    } catch (error) {
      logger.error(`Analysis failed for ${url} (Job ID: ${job.id}, Type: ${data.type})`, { error });
      throw error; 
    }
  },
  {
    connection,
    concurrency: 1,
    lockDuration: 300000, 
  }
);


worker.on('completed', (job: Job) => {
  logger.info(`Job ${job.id} in queue ${worker.name} has completed.`);
});

worker.on('failed', async (job: Job | undefined, err: Error) => {
  try {
    if (job && job.data.type === 'on-demand') {
      logger.error(`Job ${job.id} has failed all attempts. Caching final error for frontend.`);
      const errorResult = { error: `Analysis failed after ${job.opts.attempts} attempts: ${err.message}` };
      await connection.setex(`result:${job.id}`, 600, JSON.stringify(errorResult));
    } else if (job) {
      logger.error(`Job ${job.id} in queue ${worker.name} has failed after all attempts.`, { error: err.message });
    } else {
      logger.error(`An unknown job in queue ${worker.name} failed.`, { error: err.message });
    }
  } catch (e) {
    logger.error('CRITICAL: Failed to handle job failure event. This may cause a crash.', { error: e });
  }
});

logger.info('Worker process started and listening for jobs.');

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
});

import { Queue, Worker, Job } from 'bullmq';
import { connection } from '@/config/redis.js';
import { runLighthouseAnalysis } from './lighthouse.service.js';
import * as db from '../repositories/lighthouse.repository.js';
import { logger } from '@/utils/logger.js';

export interface AnalysisJobData {
  websiteId: string;
  userId: string;
  url: string;
}

const ANALYSIS_QUEUE_NAME = 'lighthouse-analysis';

export const analysisQueue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});

export const scheduleAnalysis = async (websiteId: string, userId: string, url: string, cron: string) => {
  const jobId = `website:${websiteId}`;

  if (!cron) {
    throw new Error(`Invalid cron expression: ${cron}`);
  }

  await analysisQueue.add(jobId, { websiteId, userId, url }, {
    repeat: { pattern: cron },
    jobId,
  });
  logger.info(`Scheduled analysis for ${url} (${cron}) with job ID ${jobId}`);
};

export const removeScheduledAnalysis = async (websiteId: string) => {
  const jobId = `website:${websiteId}`;
  const repeatableJobs = await analysisQueue.getRepeatableJobs();
  const jobToRemove = repeatableJobs.find(job => job.id === jobId);

  if (jobToRemove) {
    await analysisQueue.removeRepeatableByKey(jobToRemove.key);
    logger.info(`Removed scheduled analysis for job ID ${jobId}`);
  } else {
    logger.warn(`Could not find scheduled job with ID ${jobId} to remove.`);
  }
};

const worker = new Worker<AnalysisJobData>(
  ANALYSIS_QUEUE_NAME,
  async (job: Job<AnalysisJobData>) => {
    const { websiteId, userId, url } = job.data;
    logger.info(`Starting analysis for ${url} (Job ID: ${job.id})`);

    try {
      const report = await runLighthouseAnalysis(url);
      
      await db.saveReport({
        websiteId,
        userId,
        url,
        performance: report.performance,
        accessibility: report.accessibility,
        bestPractices: report.bestPractices,
        seo: report.seo,
        pwa: report.pwa,
        metrics: report.metrics,
        opportunities: report.opportunities,
        diagnostics: report.diagnostics,
        rawReport: report.rawReport,
      });

      logger.info(`Successfully completed analysis for ${url} (Job ID: ${job.id})`);
    } catch (error) {
      logger.error(`Analysis failed for ${url} (Job ID: ${job.id}):`, error);
      throw error; 
    }
  },
  { connection }
);

worker.on('completed', (job: Job) => {
  logger.info(`Job ${job.id} has completed.`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  if (job) {
    logger.error(`Job ${job.id} has failed with error: ${err.message}`);
  }
});

logger.info('Worker process started and listening for jobs.');

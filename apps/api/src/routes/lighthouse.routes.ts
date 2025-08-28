import { Hono } from 'hono';
import { clerkAuth } from '@/middleware/clerk.middleware.js';
import * as lighthouseHandler from '@/handlers/lighthouse.handler.js';
import { validate } from '@/middleware/validation.middleware.js';
import { analyzeWebsiteSchema, getReportsSchema } from '@/validators/lighthouse.validator.js';
import type { Variables } from '@/types/index.js';

export const lighthouseRoutes = new Hono<{ Variables: Variables }>()
  .use('*', clerkAuth)
  .post('/analyze', validate(analyzeWebsiteSchema, 'json'), lighthouseHandler.analyzeWebsite)
  .get('/result/:jobId', lighthouseHandler.getAnalysisResult)
  .get('/reports/user', validate(getReportsSchema, 'query'), lighthouseHandler.getUserReports)
  .get('/reports/website/:websiteId', validate(getReportsSchema, 'query'), lighthouseHandler.getWebsiteReports)
  .get('/reports/:id', lighthouseHandler.getReport)
  .delete('/reports/:id', lighthouseHandler.deleteReport);
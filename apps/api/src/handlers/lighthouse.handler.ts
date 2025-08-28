import type { Context } from 'hono';
import { requestOnDemandAnalysis } from '@/services/queue.service.js';
import { generateSeoInsights } from '@/services/lighthouse.service.js';
import * as websiteRepository from '@/repositories/website.repository.js';
import * as lighthouseRepository from '@/repositories/lighthouse.repository.js';
import { success, error, notFound, accepted } from '@/utils/response.js';
import { getValidatedData } from '@/middleware/validation.middleware.js';
import type { Variables } from '@/types/index.js';
import type { AnalyzeWebsiteInput, GetReportsQuery } from '@/validators/lighthouse.validator.js';
import { connection } from '@/config/redis.js';

type AuthContext = Context<{ Variables: Variables }>;

export const analyzeWebsite = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const data = getValidatedData<AnalyzeWebsiteInput>(c);

    const job = await requestOnDemandAnalysis(data.url);

    return success(c, { jobId: job.id }, 'Analysis job created successfully');

  } catch (err) {
    console.error('Failed to create on-demand analysis job:', err);
    return error(c, 'Failed to start analysis', 500);
  }
};

export const getAnalysisResult = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const jobId = c.req.param('jobId');
    const resultKey = `result:${jobId}`;

    const result = await connection.get(resultKey);

    if (result) {
      // Result is ready
      await connection.del(resultKey); // Clean up the key
      const data = JSON.parse(result);
      if (data.error) {
        return error(c, data.error, 500);
      }
      return success(c, data, 'Analysis complete');
    } else {
      // Result not ready yet
      return accepted(c, 'Analysis is pending');
    }
  } catch (err) {
    console.error('Failed to get analysis result:', err);
    return error(c, 'Failed to retrieve analysis result', 500);
  }
};

export const getReport = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const reportId = c.req.param('id');
    const report = await lighthouseRepository.getReportById(reportId, auth.userId);

    if (!report) {
      return notFound(c, 'Report not found');
    }

    const insights = generateSeoInsights(report);

    return success(c, {
      report: {
        ...report,
        rawReport: undefined,
      },
      insights,
    });
  } catch (err) {
    return error(c, 'Failed to get report', 500);
  }
};

export const getWebsiteReports = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const websiteId = c.req.param('websiteId');
    const query = getValidatedData<GetReportsQuery>(c);

    const website = await websiteRepository.getWebsiteById(websiteId, auth.userId);
    if (!website) {
      return notFound(c, 'Website not found');
    }

    const reports = await lighthouseRepository.getWebsiteReports(websiteId, auth.userId, query);

    return success(c, {
      website,
      reports,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: reports.length,
      },
    });
  } catch (err) {
    return error(c, 'Failed to get reports', 500);
  }
};

export const getUserReports = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const query = getValidatedData<GetReportsQuery>(c);
    const reports = await lighthouseRepository.getUserReports(auth.userId, query);

    return success(c, {
      reports,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: reports.length,
      },
    });
  } catch (err) {
    return error(c, 'Failed to get reports', 500);
  }
};

export const deleteReport = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const reportId = c.req.param('id');
    
    const report = await lighthouseRepository.getReportById(reportId, auth.userId);
    if (!report) {
      return notFound(c, 'Report not found');
    }

    await lighthouseRepository.deleteReport(reportId, auth.userId);

    return success(c, null, 'Report deleted successfully');
  } catch (err) {
    return error(c, 'Failed to delete report', 500);
  }
};
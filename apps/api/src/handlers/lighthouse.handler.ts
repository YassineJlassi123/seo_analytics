import type { Context } from 'hono';
import { runLighthouseAnalysis, generateSeoInsights } from '../services/lighthouse.service.js';
import * as websiteRepository from '@/repositories/website.repository.js';
import * as lighthouseRepository from '@/repositories/lighthouse.repository.js';
import { success, error, notFound } from '@/utils/response.js';
import { getValidatedData } from '@/middleware/validation.middleware.js';
import type { Variables } from '@/types/index.js';
import type { 
  AnalyzeWebsiteInput,
  GetReportsQuery 
} from '@/validators/lighthouse.validator.js';


type AuthContext = Context<{ Variables: Variables }>;

// Analyze a website
export const analyzeWebsite = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const data = getValidatedData<AnalyzeWebsiteInput>(c);
    
    // If websiteId provided, verify ownership
    if (data.websiteId) {
      const website = await websiteRepository.getWebsiteById(data.websiteId, auth.userId);
      if (!website) {
        return notFound(c, 'Website not found');
      }
    }

    // Run analysis
    const report = await runLighthouseAnalysis(data.url);
    
    // Generate SEO insights
    const insights = generateSeoInsights(report);

    // Save report if website exists
    let savedReport = null;
    if (data.websiteId) {
      savedReport = await lighthouseRepository.saveReport({
        websiteId: data.websiteId,
        userId: auth.userId,
        url: data.url,
        ...report,
      });
    }

    return success(c, {
      report: {
        ...report,
        rawReport: undefined, //
      },
      insights,
      saved: !!savedReport,
      reportId: savedReport?.id,
    }, 'Analysis completed successfully');
  } catch (err) {
    return error(c, 'Analysis failed', 500);
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

    // Verify website ownership
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

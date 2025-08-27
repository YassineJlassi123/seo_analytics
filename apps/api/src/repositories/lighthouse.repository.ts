import { sql, eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/database.js';
import { websites, reports } from '@/db/schema.js';

export const saveReport = async (data: {
  websiteId: string;
  userId: string;
  url: string;
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
  pwa?: number | null;
  metrics?: any;
  opportunities?: any;
  diagnostics?: any;
  rawReport?: any;
}) => {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(reports).values({
    id,
    websiteId: data.websiteId,
    userId: data.userId,
    url: data.url,
    performance: data.performance,
    accessibility: data.accessibility,
    bestPractices: data.bestPractices,
    seo: data.seo,
    pwa: data.pwa,
    metrics: data.metrics ? JSON.stringify(data.metrics) : null,
    opportunities: data.opportunities ? JSON.stringify(data.opportunities) : null,
    diagnostics: data.diagnostics ? JSON.stringify(data.diagnostics) : null,
    rawReport: data.rawReport ? JSON.stringify(data.rawReport) : null,
    createdAt: now,
  });

  await db
    .update(websites)
    .set({
      lastAnalyzedAt: now,
      updatedAt: now,
    })
    .where(eq(websites.id, data.websiteId));

  return { id, ...data, createdAt: now };
};

export const getReportById = async (id: string, userId: string) => {
  const results = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, userId)))
    .limit(1);

  const report = results[0];
  if (report) {
    return {
      ...report,
      metrics: report.metrics ? JSON.parse(report.metrics) : null,
      opportunities: report.opportunities ? JSON.parse(report.opportunities) : null,
      diagnostics: report.diagnostics ? JSON.parse(report.diagnostics) : null,
      rawReport: report.rawReport ? JSON.parse(report.rawReport) : null,
    };
  }
  return null;
};

export const getWebsiteReports = async (
  websiteId: string,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'performance' | 'seo';
    order?: 'asc' | 'desc';
  } = {}
) => {
  const { limit = 10, offset = 0, sortBy = 'createdAt', order = 'desc' } = options;

  const orderByColumn = sortBy === 'performance' ? reports.performance :
                        sortBy === 'seo' ? reports.seo :
                        reports.createdAt;

  const orderFn = order === 'desc' ? desc : asc;

  const results = await db
    .select()
    .from(reports)
    .where(and(eq(reports.websiteId, websiteId), eq(reports.userId, userId)))
    .orderBy(orderFn(orderByColumn))
    .limit(limit)
    .offset(offset);

  return results.map(report => ({
    ...report,
    metrics: report.metrics ? JSON.parse(report.metrics) : null,
    opportunities: report.opportunities ? JSON.parse(report.opportunities) : null,
    diagnostics: report.diagnostics ? JSON.parse(report.diagnostics) : null,
    rawReport: null, 
  }));
};

export const getUserReports = async (
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
) => {
  const { limit = 10, offset = 0 } = options;

  const results = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map(report => ({
    ...report,
    metrics: report.metrics ? JSON.parse(report.metrics) : null,
    opportunities: report.opportunities ? JSON.parse(report.opportunities) : null,
    diagnostics: report.diagnostics ? JSON.parse(report.diagnostics) : null,
    rawReport: null,
  }));
};

export const deleteReport = async (id: string, userId: string) => {
  await db
    .delete(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, userId)));
};

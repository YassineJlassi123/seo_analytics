import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import type { LighthouseReport } from '@/types/index.js';

export interface LighthouseOptions {
  onlyCategories?: Array<'performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa'>;
  formFactor?: 'mobile' | 'desktop';
  screenEmulation?: any;
}

// Define types for Lighthouse audit structure
interface LighthouseAudit {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  numericValue?: number;
  displayValue?: string;
  details?: {
    type: string;
    [key: string]: any;
  };
}

interface LighthouseCategory {
  score: number | null;
}

interface LighthouseResult {
  finalUrl: string;
  categories: {
    performance?: LighthouseCategory;
    accessibility?: LighthouseCategory;
    'best-practices'?: LighthouseCategory;
    seo?: LighthouseCategory;
    pwa?: LighthouseCategory;
  };
  audits: Record<string, LighthouseAudit>;
}

const defaultOptions: LighthouseOptions = {
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false,
  }
};

export const runLighthouseAnalysis = async (
  url: string,
  options: LighthouseOptions = {}
): Promise<Partial<LighthouseReport>> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 60000, // 60 seconds
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const mergedOptions = { ...defaultOptions, ...options };
    
    const wsEndpoint = browser.wsEndpoint();
    const portMatch = wsEndpoint.match(/:(\d+)\//);
    const port = portMatch ? parseInt(portMatch[1] || '0', 10) : 9222;
    
    // Run Lighthouse
    const runnerResult = await lighthouse(url, {
      port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: mergedOptions.onlyCategories,
      formFactor: mergedOptions.formFactor,
      screenEmulation: mergedOptions.screenEmulation,
    }, {
      extends: 'lighthouse:default',
    });

    // Check if lighthouse run was successful
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse analysis failed - no results returned');
    }

    const lhr = runnerResult.lhr as LighthouseResult;

    // Extract scores (0-100 scale)
    const scores = {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
      pwa: Math.round((lhr.categories.pwa?.score || 0) * 100),
    };

    // Extract key metrics
    const metrics = {
      firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
      largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
      totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
      cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
      speedIndex: lhr.audits['speed-index']?.numericValue,
      timeToInteractive: lhr.audits['interactive']?.numericValue,
    };

    // Extract opportunities (performance improvements)
    const opportunities = Object.values(lhr.audits)
      .filter((audit): audit is LighthouseAudit => 
        audit !== null &&
        audit.details?.type === 'opportunity' && 
        typeof audit.score === 'number' &&
        audit.score < 0.9
      )
      .map(audit => ({
        id: audit.id,
        title: audit.title,
        description: audit.description || '',
        score: Math.round((audit.score || 0) * 100),
        displayValue: audit.displayValue,
        details: audit.details,
      }))
      .sort((a, b) => a.score - b.score);

    // Extract diagnostics
    const diagnostics = Object.values(lhr.audits)
      .filter((audit): audit is LighthouseAudit => 
        audit !== null &&
        audit.details?.type === 'table' && 
        typeof audit.score === 'number' &&
        audit.score < 1 &&
        !opportunities.find(o => o.id === audit.id)
      )
      .map(audit => ({
        id: audit.id,
        title: audit.title,
        description: audit.description || '',
        score: Math.round((audit.score || 0) * 100),
        displayValue: audit.displayValue,
        details: audit.details,
      }))
      .sort((a, b) => a.score - b.score);

    return {
      url: lhr.finalUrl,
      ...scores,
      metrics,
      opportunities: opportunities.slice(0, 10), // Top 10 opportunities
      diagnostics: diagnostics.slice(0, 10), // Top 10 diagnostics
      rawReport: lhr,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Connection closed')) {
      throw new Error('Could not connect to the URL. The website might be down or blocking automated access.');
    }
    throw error;
  } finally {
    await browser.close();
  }
};

export const analyzeBatch = async (
  urls: string[],
  options: LighthouseOptions = {}
): Promise<Array<{ url: string; report?: Partial<LighthouseReport>; error?: string }>> => {
  const results = [];

  for (const url of urls) {
    try {
      const report = await runLighthouseAnalysis(url, options);
      results.push({ url, report });
    } catch (error) {
      results.push({ 
        url, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      });
    }
  }

  return results;
};

export const generateSeoInsights = (report: Partial<LighthouseReport>) => {
  const insights = [];

  if (report.seo && report.seo < 90) {
    insights.push({
      category: 'SEO',
      level: report.seo < 50 ? 'critical' : report.seo < 70 ? 'warning' : 'info',
      message: `SEO score is ${report.seo}/100. Consider improving meta tags, structured data, and content optimization.`,
    });
  }

  if (report.performance && report.performance < 90) {
    insights.push({
      category: 'Performance',
      level: report.performance < 50 ? 'critical' : report.performance < 70 ? 'warning' : 'info',
      message: `Performance score is ${report.performance}/100. Page speed affects SEO rankings.`,
    });
  }

  if (report.accessibility && report.accessibility < 90) {
    insights.push({
      category: 'Accessibility',
      level: report.accessibility < 50 ? 'critical' : report.accessibility < 70 ? 'warning' : 'info',
      message: `Accessibility score is ${report.accessibility}/100. Better accessibility improves user experience and SEO.`,
    });
  }

  // Analyze metrics
  if (report.metrics) {
    if (report.metrics.largestContentfulPaint && report.metrics.largestContentfulPaint > 2500) {
      insights.push({
        category: 'Core Web Vitals',
        level: report.metrics.largestContentfulPaint > 4000 ? 'critical' : 'warning',
        message: `LCP is ${(report.metrics.largestContentfulPaint / 1000).toFixed(1)}s. Should be under 2.5s for good user experience.`,
      });
    }

    if (report.metrics.cumulativeLayoutShift && report.metrics.cumulativeLayoutShift > 0.1) {
      insights.push({
        category: 'Core Web Vitals',
        level: report.metrics.cumulativeLayoutShift > 0.25 ? 'critical' : 'warning',
        message: `CLS is ${report.metrics.cumulativeLayoutShift.toFixed(3)}. Should be under 0.1 for visual stability.`,
      });
    }
  }

  return insights;
};
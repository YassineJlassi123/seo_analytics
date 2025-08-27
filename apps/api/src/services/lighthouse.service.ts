import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import type { LighthouseReport } from '@/types/index.js';

export interface LighthouseOptions {
  onlyCategories?: Array<'performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa'>;
  formFactor?: 'mobile' | 'desktop';
  screenEmulation?: any;
  retries?: number;
}

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
  },
  retries: 2
};

const clearPerformanceMarks = () => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.performance) {
      globalThis.performance.clearMarks?.();
      globalThis.performance.clearMeasures?.();
    }
    if (typeof global !== 'undefined' && global.performance) {
      global.performance.clearMarks?.();
      global.performance.clearMeasures?.();
    }
    if (typeof performance !== 'undefined') {
      performance.clearMarks?.();
      performance.clearMeasures?.();
    }
  } catch (error) {
  }
};

const forceCleanPerformance = () => {
  try {
    clearPerformanceMarks();
    
    if (global.gc) {
      global.gc();
    }
    
    return new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    return Promise.resolve();
  }
};

export const runLighthouseAnalysis = async (
  url: string,
  options: LighthouseOptions = {}
): Promise<Partial<LighthouseReport>> => {
  const mergedOptions = { ...defaultOptions, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (mergedOptions.retries || 0); attempt++) {
    let browser;
    
    try {
      await forceCleanPerformance();
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=site-per-process',
          '--disable-extensions',
          '--disable-translate',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-background-networking',
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-experiments',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-component-extensions-with-background-pages',
        ],
        timeout: 120000,
        protocolTimeout: 120000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const config = {
        extends: 'lighthouse:default',
        settings: {
          maxWaitForLoad: 45000,
          maxWaitForFcp: 15000,
          pauseAfterFcpMs: 1000,
          pauseAfterLoadMs: 1000,
          networkQuietThresholdMs: 1000,
          cpuQuietThresholdMs: 1000,
          formFactor: mergedOptions.formFactor,
          screenEmulation: mergedOptions.screenEmulation,
          emulatedUserAgent: mergedOptions.formFactor === 'mobile' 
            ? 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
          onlyCategories: mergedOptions.onlyCategories,
          skipAudits: [
            'uses-http2',
            'bf-cache',
            'performance-budget',
            'timing-budget'
          ],
          disableStorageReset: true,
          throttlingMethod: 'simulate' as const,
        }
      };

      const runnerResult = await lighthouse(
        url,
        {
          port: parseInt(new URL(browser.wsEndpoint()).port, 10),
          output: 'json',
          logLevel: 'error',
        },
        config
      );

      if (!runnerResult || !runnerResult.lhr) {
        throw new Error('Lighthouse analysis failed - no results returned');
      }

      const lhr = runnerResult.lhr as LighthouseResult;

      const scores = {
        performance: Math.round((lhr.categories.performance?.score || 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round(
          (lhr.categories['best-practices']?.score || 0) * 100
        ),
        seo: Math.round((lhr.categories.seo?.score || 0) * 100),
        pwa: Math.round((lhr.categories.pwa?.score || 0) * 100),
      };

      const metrics = {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint:
          lhr.audits['largest-contentful-paint']?.numericValue,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
        speedIndex: lhr.audits['speed-index']?.numericValue,
        timeToInteractive: lhr.audits['interactive']?.numericValue,
      };

      const opportunities = Object.values(lhr.audits)
        .filter(
          (audit): audit is LighthouseAudit =>
            audit !== null &&
            audit.details?.type === 'opportunity' &&
            typeof audit.score === 'number' &&
            audit.score < 0.9
        )
        .map((audit) => ({
          id: audit.id,
          title: audit.title,
          description: audit.description || '',
          score: Math.round((audit.score || 0) * 100),
          displayValue: audit.displayValue,
          details: audit.details,
        }))
        .sort((a, b) => a.score - b.score);

      const diagnostics = Object.values(lhr.audits)
        .filter(
          (audit): audit is LighthouseAudit =>
            audit !== null &&
            audit.details?.type === 'table' &&
            typeof audit.score === 'number' &&
            audit.score < 1 &&
            !opportunities.find((o) => o.id === audit.id)
        )
        .map((audit) => ({
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
        opportunities: opportunities.slice(0, 10),
        diagnostics: diagnostics.slice(0, 10),
        rawReport: lhr,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt < (mergedOptions.retries || 0)) {
        const delay = (2000 * Math.pow(2, attempt)) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } finally {
      if (browser) {
        try {
          const pages = await browser.pages();
          await Promise.all(pages.map(page => page.close().catch(() => {})));
          
          await browser.close();
        } catch (closeError) {
          console.warn('Error closing browser:', closeError);
        }
      }
      
      await forceCleanPerformance();
    }
  }

  if (lastError) {
    if (lastError.name === 'TargetCloseError') {
      throw new Error(
        `The page crashed during analysis after ${mergedOptions.retries! + 1} attempts. This can happen on complex websites or due to memory constraints.`
      );
    }
    if (lastError.message.includes('PROTOCOL_ERROR')) {
      throw new Error(
        `Could not navigate to the URL after ${mergedOptions.retries! + 1} attempts. It might be invalid or the page may have crashed.`
      );
    }
    if (lastError.message.includes('performance mark') || lastError.message.includes('Performance Mark')) {
      throw new Error(
        `Performance timing error after ${mergedOptions.retries! + 1} attempts. This is usually caused by conflicting performance measurements. Try restarting the service.`
      );
    }
    
    throw new Error(`Analysis failed after ${mergedOptions.retries! + 1} attempts: ${lastError.message}`);
  }

  throw new Error('Unexpected error: no attempts were made');
};

export const analyzeBatch = async (
  urls: string[],
  options: LighthouseOptions = {}
): Promise<Array<{ url: string; report?: Partial<LighthouseReport>; error?: string }>> => {
  const results = [];

  for (const url of urls) {
    try {
      console.log(`Analyzing: ${url}`);
      const report = await runLighthouseAnalysis(url, options);
      results.push({ url, report });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`Failed to analyze ${url}:`, error);
      results.push({ 
        url, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
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
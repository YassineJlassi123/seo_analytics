import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { execSync } from 'child_process';
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

// Enhanced Chrome executable detection with verification
const getChromeExecutablePath = () => {
  const fs = require('fs');
  
  // First try to use which/whereis commands to find Chrome
  const commands = [
    'which google-chrome-stable',
    'which google-chrome',
    'which chromium-browser',
    'which chromium',
    'whereis google-chrome-stable',
    'whereis google-chrome',
    'whereis chromium-browser',
    'whereis chromium'
  ];

  for (const cmd of commands) {
    try {
      const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (result && !result.includes('not found')) {
        const path = result.split(':')[1]?.trim() || result.split(' ')[0]?.trim() || result;
        if (path && fs.existsSync(path)) {
          try {
            fs.accessSync(path, fs.constants.X_OK);
            console.log(`Found executable Chrome via command '${cmd}':`, path);
            return path;
          } catch (error) {
            console.log(`Chrome found but not executable at: ${path}`);
          }
        }
      }
    } catch (error) {
      // Command failed, continue
    }
  }

  // Try Puppeteer's bundled Chrome if system Chrome not found
  try {
    const puppeteerExecutable = puppeteer.executablePath();
    if (puppeteerExecutable && fs.existsSync(puppeteerExecutable)) {
      try {
        fs.accessSync(puppeteerExecutable, fs.constants.X_OK);
        console.log('Using Puppeteer bundled Chrome:', puppeteerExecutable);
        return puppeteerExecutable;
      } catch (error) {
        console.log('Puppeteer Chrome found but not executable:', puppeteerExecutable);
      }
    }
  } catch (error) {
    console.log('Puppeteer bundled Chrome not available:', error);
  }

  // Environment variables
  const envPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.GOOGLE_CHROME_BIN,
    process.env.CHROME_BIN,
  ];

  for (const path of envPaths) {
    if (path && fs.existsSync(path)) {
      try {
        fs.accessSync(path, fs.constants.X_OK);
        console.log('Found executable Chrome from environment:', path);
        return path;
      } catch (error) {
        console.log('Chrome from environment not executable:', path);
      }
    }
  }

  // Common system paths as fallback
  const possiblePaths = [
    // Puppeteer cache locations (various versions)
    '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
    '/root/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
    '/home/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
    // System Chrome locations
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/usr/local/bin/chrome',
    '/usr/local/bin/chromium',
    '/opt/google/chrome/chrome',
    '/opt/google/chrome/google-chrome',
  ];

  for (const pathPattern of possiblePaths) {
    if (pathPattern.includes('*')) {
      // Handle glob patterns
      try {
        const globSync = require('glob').sync || require('glob');
        const matches = globSync(pathPattern);
        for (const match of matches) {
          if (fs.existsSync(match)) {
            try {
              fs.accessSync(match, fs.constants.X_OK);
              console.log('Found executable Chrome via glob pattern:', match);
              return match;
            } catch (error) {
              console.log('Chrome found but not executable:', match);
            }
          }
        }
      } catch (error) {
        // Glob not available or failed, continue
      }
    } else {
      if (fs.existsSync(pathPattern)) {
        try {
          fs.accessSync(pathPattern, fs.constants.X_OK);
          console.log('Found executable Chrome at system path:', pathPattern);
          return pathPattern;
        } catch (error) {
          console.log('Chrome found but not executable:', pathPattern);
        }
      }
    }
  }

  console.log('No Chrome executable found in any of the expected locations');
  return undefined;
};

// Attempt to install Chrome if not found
const ensureChromeInstalled = async (): Promise<string | undefined> => {
  let chromePath = getChromeExecutablePath();
  
  if (chromePath) {
    return chromePath;
  }

  console.log('Chrome not found, attempting to install...');
  
  // Try multiple installation methods
  const installCommands = [
    // Puppeteer install
    'npx puppeteer browsers install chrome',
    // System package manager installs
    'apt-get update && apt-get install -y google-chrome-stable',
    'apt-get update && apt-get install -y chromium-browser',
    'yum install -y google-chrome-stable',
    'yum install -y chromium',
    // Alternative Puppeteer install
    'npm install puppeteer && npx puppeteer browsers install chrome',
  ];

  for (const cmd of installCommands) {
    try {
      console.log(`Trying installation command: ${cmd}`);
      execSync(cmd, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 120000 // 2 minutes timeout
      });
      
      // Check if Chrome is now available
      chromePath = getChromeExecutablePath();
      if (chromePath) {
        console.log(`Chrome successfully installed via: ${cmd}`);
        return chromePath;
      }
    } catch (error) {
      console.log(`Installation command failed: ${cmd}`, error);
    }
  }

  return undefined;
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
    // Silently ignore
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
      
      // Ensure Chrome is installed and get path
      const chromeExecutable = await ensureChromeInstalled();
      
      if (!chromeExecutable) {
        throw new Error('Chrome installation failed - no executable found after installation attempts');
      }
      
      // Enhanced browser configuration
      const browserOptions: any = {
        headless: true,
        executablePath: chromeExecutable,
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
          '--disable-software-rasterizer',
          '--disable-default-apps',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--disable-crash-reporter',
          '--disable-logging',
          '--memory-pressure-off',
          '--max-old-space-size=4096',
        ],
        timeout: 120000,
        protocolTimeout: 120000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
      };

      console.log('Launching browser with options:', {
        executablePath: browserOptions.executablePath,
        isProduction: process.env.NODE_ENV === 'production',
        attempt: attempt + 1
      });

      browser = await puppeteer.launch(browserOptions);

      // Wait for browser to fully initialize
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
    // Enhanced error messages
    if (lastError.message.includes('Could not find Chrome') || 
        lastError.message.includes('Browser was not found') ||
        lastError.message.includes('Chrome installation failed')) {
      throw new Error(
        `Chrome browser not available after ${mergedOptions.retries! + 1} attempts. ` +
        `Installation failed. This might be due to system restrictions or missing dependencies. ` +
        `Please ensure Chrome/Chromium is properly installed on the system.`
      );
    }
    
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
export interface LighthouseConfig {
  extends: 'lighthouse:default' | 'lighthouse:no-pwa';
  settings?: {
    formFactor?: 'mobile' | 'desktop';
    throttling?: {
      rttMs?: number;
      throughputKbps?: number;
      requestLatencyMs?: number;
      downloadThroughputKbps?: number;
      uploadThroughputKbps?: number;
      cpuSlowdownMultiplier?: number;
    };
    screenEmulation?: {
      mobile?: boolean;
      width?: number;
      height?: number;
      deviceScaleFactor?: number;
      disabled?: boolean;
    };
    emulatedUserAgent?: string;
    onlyCategories?: string[];
    onlyAudits?: string[];
    skipAudits?: string[];
  };
}

export interface LighthouseFlags {
  port?: number;
  hostname?: string;
  logLevel?: 'silent' | 'error' | 'info' | 'verbose';
  output?: 'json' | 'html' | 'csv';
  outputPath?: string;
  view?: boolean;
  configPath?: string;
  preset?: 'perf' | 'experimental';
  chromeFlags?: string[];
  enableErrorReporting?: boolean;
  locale?: string;
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: 'binary' | 'numeric' | 'informative' | 'notApplicable';
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
  details?: LighthouseAuditDetails;
  warnings?: string[];
  errorMessage?: string;
}

export interface LighthouseAuditDetails {
  type: 'opportunity' | 'table' | 'list' | 'filmstrip' | 'screenshot' | 'criticalrequestchain';
  headings?: Array<{
    key: string;
    itemType: string;
    text: string;
    granularity?: number;
  }>;
  items?: any[];
  overallSavingsMs?: number;
  overallSavingsBytes?: number;
  sortedBy?: string[];
}

export interface LighthouseCategory {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  manualDescription?: string;
  auditRefs: Array<{
    id: string;
    weight: number;
    group?: string;
  }>;
}

export interface LighthouseTiming {
  entries: Array<{
    startTime: number;
    name: string;
    duration?: number;
    entryType: string;
  }>;
  total: number;
}

export interface LighthouseEnvironment {
  networkUserAgent: string;
  hostUserAgent: string;
  benchmarkIndex: number;
  credits: Record<string, string>;
}

export interface LighthouseResult {
  userAgent: string;
  environment: LighthouseEnvironment;
  lighthouseVersion: string;
  fetchTime: string;
  requestedUrl: string;
  finalUrl: string;
  runWarnings: string[];
  audits: Record<string, LighthouseAudit>;
  categories: Record<string, LighthouseCategory>;
  categoryGroups?: Record<string, {
    title: string;
    description?: string;
  }>;
  timing: LighthouseTiming;
  i18n: {
    rendererFormattedStrings: Record<string, string>;
    icuMessagePaths: Record<string, any>;
  };
}

export interface LighthouseError extends Error {
  code?: string;
  friendlyMessage?: string;
  lhrRuntimeError?: boolean;
}

// Core Web Vitals thresholds
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000,
  },
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300,
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
  },
  FCP: {
    GOOD: 1800,
    NEEDS_IMPROVEMENT: 3000,
  },
  TTI: {
    GOOD: 3800,
    NEEDS_IMPROVEMENT: 7300,
  },
  TBT: {
    GOOD: 200,
    NEEDS_IMPROVEMENT: 600,
  },
  SI: {
    GOOD: 3400,
    NEEDS_IMPROVEMENT: 5800,
  },
} as const;

// Performance scoring thresholds
export const LIGHTHOUSE_SCORE_THRESHOLDS = {
  GOOD: 90,
  NEEDS_IMPROVEMENT: 50,
} as const;

// Common device configurations
export const DEVICE_CONFIGS = {
  desktop: {
    formFactor: 'desktop' as const,
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },
  mobile: {
    formFactor: 'mobile' as const,
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1600,
      cpuSlowdownMultiplier: 4,
    },
  },
} as const;

export type DeviceType = keyof typeof DEVICE_CONFIGS;
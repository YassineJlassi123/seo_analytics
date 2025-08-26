import type { User } from '@clerk/backend';

// Response types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Context types
export interface AuthContext {
  user: User;
  userId: string;
  sessionId: string;
}

export interface Variables {
  auth?: AuthContext;
}

// Website analysis types
export interface Website {
  id: string;
  userId: string;
  url: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
  cron?: string | null;
  lastAnalyzedAt?: Date | null;
}

export interface LighthouseReport {
  id: string;
  websiteId: string;
  url: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number| null;
  pwa: number | null;
  metrics: {
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    totalBlockingTime?: number;
    cumulativeLayoutShift?: number;
    speedIndex?: number;
    timeToInteractive?: number;
  };
  opportunities?: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    displayValue?: string;
    details?: any;
  }>;
  diagnostics?: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    displayValue?: string;
    details?: any;
  }>;
  createdAt: Date;
  rawReport?: any;
}

export interface AnalysisRequest {
  url: string;
  websiteId?: string;
  immediate?: boolean;
}

export interface AnalysisJob {
  id: string;
  websiteId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  reportId?: string;
  createdAt: Date;
  completedAt?: Date;
}
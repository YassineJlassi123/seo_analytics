import { hc } from 'hono/client';
import type { AppType } from 'api';
import { InferResponseType } from 'hono/client';

const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

// Create authenticated client
export const createApiClient = (token: string) => {
  return hc<AppType>(getApiUrl(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Create unauthenticated client
export const client = hc<AppType>(getApiUrl());
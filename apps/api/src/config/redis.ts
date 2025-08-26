
import * as Redis from 'ioredis';
import { env } from './env.js';

// @ts-ignore
export const connection = new Redis.default(env.REDIS_URL, {
  maxRetriesPerRequest: null, 
});

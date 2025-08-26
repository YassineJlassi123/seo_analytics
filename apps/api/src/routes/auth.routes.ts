import { Hono } from 'hono';
import { clerkAuth } from '@/middleware/clerk.middleware.js';
import * as authHandler from '@/handlers/auth.handler.js';
import type { Variables } from '@/types/index.js';

export const authRoutes = new Hono<{ Variables: Variables }>()
  .use('*', clerkAuth)
  .get('/me', authHandler.getCurrentUser)
  .get('/verify', authHandler.verifyToken)  
  .get('/user/:id', authHandler.getUserById);
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from '@/routes/index.js';
import { errorHandler } from '@/middleware/error.middleware.js';
import { healthCheck } from '@/handlers/auth.handler.js';
import type { Variables } from '@/types/index.js';

// Create main app
const app = new Hono<{ Variables: Variables }>()
  .use('*', cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))
  .get('/', (c) => c.json({
    success: true,
    message: 'Lighthouse Analytics API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }))
  .get('/health', healthCheck);

// CRITICAL: Chain the API routes properly for type inference
const apiApp = app.route('/api', routes);

// Add error handlers
apiApp.onError(errorHandler);
apiApp.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found',
    path: c.req.path,
  }, 404);
});

// Export the FINAL chained app type
export type AppType = typeof apiApp;
export default app;
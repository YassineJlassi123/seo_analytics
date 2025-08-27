import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from '@/routes/index.js';
import { errorHandler } from '@/middleware/error.middleware.js';
import { healthCheck } from '@/handlers/auth.handler.js';
import type { Variables } from '@/types/index.js';

const app = new Hono<{ Variables: Variables }>()
  .use('*', cors({
    origin: [process.env.FRONTEND_URL || 'https://my-turbo-app.vercel.app/'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
  }))
  .get('/', (c) => c.json({
    success: true,
    message: 'Lighthouse Analytics API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }))
  .get('/health', healthCheck);

const apiApp = app.route('/api', routes);

apiApp.onError(errorHandler);
apiApp.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found',
    path: c.req.path,
  }, 404);
});

export type AppType = typeof apiApp;
export default app;
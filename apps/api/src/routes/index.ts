import { Hono } from 'hono';
import { authRoutes } from '@/routes/auth.routes.js';
import { lighthouseRoutes } from '@/routes/lighthouse.routes.js';
import { websiteRoutes } from '@/routes/website.routes.js';
import type { Variables } from '@/types/index.js';

const routes = new Hono<{ Variables: Variables }>()
  .route('/auth', authRoutes)
  .route('/websites', websiteRoutes)
  .route('/lighthouse', lighthouseRoutes);

export type ApiRoutesType = typeof routes;
export { routes };
import { Hono } from 'hono';
import { clerkAuth } from '@/middleware/clerk.middleware.js';
import * as websiteHandler from '@/handlers/website.handler.js';
import { validate } from '@/middleware/validation.middleware.js';
import type { Variables } from '@/types/index.js';
import { 
  createWebsiteSchema, 
  updateWebsiteSchema,
  idParamSchema
} from '@/validators/website.validator.js';

export const websiteRoutes = new Hono<{ Variables: Variables }>()
  .use('*', clerkAuth)

  .get('/', websiteHandler.getUserWebsites)

  .post('/', validate(createWebsiteSchema, 'json'), websiteHandler.createWebsite)

  .get('/:id', validate(idParamSchema, 'param'), websiteHandler.getWebsite)

  .put(
    '/:id',
    validate(idParamSchema, 'param'),
    validate(updateWebsiteSchema, 'json'),
    websiteHandler.updateWebsite
  )

  .delete('/:id', validate(idParamSchema, 'param'), websiteHandler.deleteWebsite);

import { z } from 'zod';

// URL validation
const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol');

// Cron expression validation (basic)
const cronSchema = z.string()
  .regex(/^(\S+\s+){4}\S+$/, 'Invalid cron expression format')
  .optional();

// Website schemas
export const createWebsiteSchema = z.object({
  url: urlSchema,
  name: z.string().min(1).max(255).optional(),
  cron: cronSchema,
});

export const updateWebsiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  cron: cronSchema,
});


// Param schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Type exports
export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
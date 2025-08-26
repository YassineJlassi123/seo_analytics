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



// Analysis schemas
export const analyzeWebsiteSchema = z.object({
  url: urlSchema,
  websiteId: z.string().uuid().optional(),
  immediate: z.boolean().default(true),
});

export const getReportsSchema = z.object({
  websiteId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'performance', 'seo']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Param schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const websiteIdParamSchema = z.object({
  websiteId: z.string().uuid('Invalid website ID'),
});

// Type exports

export type AnalyzeWebsiteInput = z.infer<typeof analyzeWebsiteSchema>;
export type GetReportsQuery = z.infer<typeof getReportsSchema>;
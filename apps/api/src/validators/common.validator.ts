import { z } from 'zod';


export const uuidSchema = z.string().uuid('Invalid UUID format');

export const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol')
  .refine(url => {
    try {
      const parsed = new URL(url);
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname.toLowerCase();
        return !hostname.includes('localhost') && 
               !hostname.includes('127.0.0.1') && 
               !hostname.includes('0.0.0.0') &&
               !hostname.match(/^192\.168\.\d+\.\d+$/) &&
               !hostname.match(/^10\.\d+\.\d+\.\d+$/) &&
               !hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/);
      }
      return true;
    } catch {
      return false;
    }
  }, 'Invalid URL - internal/localhost URLs not allowed in production');

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters');

export const shortTextSchema = z.string()
  .min(1, 'Field is required')
  .max(255, 'Text must be less than 255 characters')
  .trim();

export const mediumTextSchema = z.string()
  .min(1, 'Field is required')
  .max(1000, 'Text must be less than 1000 characters')
  .trim();

export const longTextSchema = z.string()
  .min(1, 'Field is required')
  .max(5000, 'Text must be less than 5000 characters')
  .trim();

export const optionalShortTextSchema = shortTextSchema.optional();
export const optionalMediumTextSchema = mediumTextSchema.optional();
export const optionalLongTextSchema = longTextSchema.optional();

export const paginationSchema = z.object({
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(10),
  offset: z.coerce.number()
    .min(0, 'Offset must be non-negative')
    .default(0),
});

export const sortingSchema = z.object({
  sortBy: z.string().min(1, 'Sort field is required'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const paginatedSortingSchema = paginationSchema.merge(sortingSchema);

// Date validation
export const dateSchema = z.coerce.date();

export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).refine(
  data => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  'Start date must be before or equal to end date'
);

export const booleanSchema = z.union([
  z.boolean(),
  z.string().transform(val => val === 'true'),
]).default(false);

// Numeric validation
export const positiveIntegerSchema = z.coerce.number()
  .int('Must be an integer')
  .positive('Must be positive');

export const nonNegativeIntegerSchema = z.coerce.number()
  .int('Must be an integer')
  .min(0, 'Must be non-negative');

export const percentageSchema = z.coerce.number()
  .min(0, 'Must be at least 0')
  .max(100, 'Must be at most 100');

// Phone number validation (basic)
export const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long');

// Common enum schemas
export const frequencySchema = z.enum(['daily', 'weekly', 'monthly']);
export const statusSchema = z.enum(['active', 'inactive', 'pending', 'archived']);
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// ID parameter validation
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Search query validation
export const searchSchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(255, 'Search query too long')
    .trim()
    .optional(),
  ...paginationSchema.shape,
});

// File upload validation
export const fileTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const fileSizeSchema = z.number()
  .max(10 * 1024 * 1024, 'File size must be less than 10MB'); // 10MB limit

// API key validation
export const apiKeySchema = z.string()
  .min(32, 'API key too short')
  .max(128, 'API key too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid API key format');

// Color validation (hex colors)
export const hexColorSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

// Slug validation (URL-friendly strings)
export const slugSchema = z.string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format - use lowercase letters, numbers, and hyphens');

// JSON validation
export const jsonSchema = z.string()
  .refine(val => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON format')
  .transform(val => JSON.parse(val));

// Common response schemas
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) => 
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  details: z.any().optional(),
});

export const createEnumSchema = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);

export const optionalWithDefault = <T>(schema: z.ZodType<T>, defaultValue: Exclude<T, undefined>) =>
  schema.optional().default(defaultValue);


export type UUID = z.infer<typeof uuidSchema>;
export type URL = z.infer<typeof urlSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Sorting = z.infer<typeof sortingSchema>;
export type PaginatedSorting = z.infer<typeof paginatedSortingSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Frequency = z.infer<typeof frequencySchema>;
export type Status = z.infer<typeof statusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
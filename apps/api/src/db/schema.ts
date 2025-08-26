import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Schema definitions
export const websites = pgTable('websites', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  url: text('url').notNull(),
  name: text('name'),
  cron: text('cron'),
  lastAnalyzedAt: timestamp('last_analyzed_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  websiteId: text('website_id').notNull(),
  userId: text('user_id').notNull(),
  url: text('url').notNull(),
  performance: integer('performance'),
  accessibility: integer('accessibility'),
  bestPractices: integer('best_practices'),
  seo: integer('seo'),
  pwa: integer('pwa'),
  metrics: text('metrics'), // JSON string
  opportunities: text('opportunities'), // JSON string
  diagnostics: text('diagnostics'), // JSON string
  rawReport: text('raw_report'), // JSON string
  createdAt: timestamp('created_at').notNull(),
});
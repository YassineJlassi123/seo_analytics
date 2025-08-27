import { sql, eq, and, desc } from 'drizzle-orm';
import { db } from '@/database.js';
import { websites, reports } from '@/db/schema.js';
import type { Website } from '@/types/index.js';

export const createWebsite = async (data: {
  userId: string;
  url: string;
  name?: string;
  cron?: string;
}) => {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(websites).values({
    id,
    userId: data.userId,
    url: data.url,
    name: data.name,
    cron: data.cron,
    createdAt: now,
    updatedAt: now,
  });

  return { id, ...data, createdAt: now, updatedAt: now };
};

export const getWebsiteById = async (id: string, userId: string) => {
  const results = await db
    .select()
    .from(websites)
    .where(and(eq(websites.id, id), eq(websites.userId, userId)))
    .limit(1);

  return results[0];
};

export const getUserWebsites = async (userId: string) => {
  return await db
    .select()
    .from(websites)
    .where(eq(websites.userId, userId))
    .orderBy(desc(websites.createdAt));
};

export const updateWebsite = async (
  id: string,
  userId: string,
  data: Partial<Pick<Website, 'name' | 'cron'>>
) => {
  await db
    .update(websites)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(websites.id, id), eq(websites.userId, userId)));
};

export const deleteWebsite = async (id: string, userId: string) => {
  await db.delete(reports).where(eq(reports.websiteId, id));

  await db
    .delete(websites)
    .where(and(eq(websites.id, id), eq(websites.userId, userId)));
};

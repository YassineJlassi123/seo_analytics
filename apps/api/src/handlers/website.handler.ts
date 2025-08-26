import type { Context } from 'hono';
import * as websiteRepository from '@/repositories/website.repository.js';
import * as lighthouseRepository from '@/repositories/lighthouse.repository.js';
import { success, error, notFound } from '@/utils/response.js';
import { getValidatedData } from '@/middleware/validation.middleware.js';
import { scheduleAnalysis, removeScheduledAnalysis } from '@/services/queue.service.js';
import type { Variables } from '@/types/index.js';
import type { CreateWebsiteInput, UpdateWebsiteInput } from '@/validators/website.validator.js';

type AuthContext = Context<{ Variables: Variables }>;

export const createWebsite = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const data = getValidatedData<CreateWebsiteInput>(c);

    const existing = await websiteRepository.getUserWebsites(auth.userId);

    if (existing.find(w => w.url === data.url)) {
      return error(c, 'Website already exists', 409);
    }

    const website = await websiteRepository.createWebsite({
      userId: auth.userId,
      ...data,
    });

    if (website.cron) {
      await scheduleAnalysis(website.id, auth.userId, website.url, website.cron);
    }

    return success(c, website, 'Website created successfully', 201);
  } catch (err) {
    console.log(err);
    return error(c, 'Failed to create website', 500);
  }
};

export const getUserWebsites = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const websites = await websiteRepository.getUserWebsites(auth.userId);
    return success(c, websites, 'Websites retrieved successfully');
  } catch (err) {
    return error(c, 'Failed to get websites', 500);
  }
};

export const getWebsite = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const params = getValidatedData<{ id: string }>(c);
    const website = await websiteRepository.getWebsiteById(params.id, auth.userId);

    if (!website) return notFound(c, 'Website not found');

    const reports = await lighthouseRepository.getWebsiteReports(params.id, auth.userId, {
      limit: 5,
      sortBy: 'createdAt',
      order: 'desc',
    });

    return success(c, { website, recentReports: reports });
  } catch (err) {
    return error(c, 'Failed to get website', 500);
  }
};

export const updateWebsite = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const params = getValidatedData<{ id: string }>(c);
    const data = getValidatedData<UpdateWebsiteInput>(c);

    const originalWebsite = await websiteRepository.getWebsiteById(params.id, auth.userId);
    if (!originalWebsite) return notFound(c, 'Website not found');

    await websiteRepository.updateWebsite(params.id, auth.userId, data);

    const updatedWebsite = { ...originalWebsite, ...data };

    const cronChanged = originalWebsite.cron !== updatedWebsite.cron;
    if (cronChanged) {
      if (originalWebsite.cron) await removeScheduledAnalysis(params.id);
      if (updatedWebsite.cron) await scheduleAnalysis(params.id, auth.userId, updatedWebsite.url, updatedWebsite.cron);
    }

    return success(c, { ...updatedWebsite, updatedAt: new Date() }, 'Website updated successfully');
  } catch (err) {
    return error(c, 'Failed to update website', 500);
  }
};

export const deleteWebsite = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    if (!auth) return error(c, 'Unauthorized', 401);

    const params = getValidatedData<{ id: string }>(c);
    const website = await websiteRepository.getWebsiteById(params.id, auth.userId);
    if (!website) return notFound(c, 'Website not found');

    if (website.cron) await removeScheduledAnalysis(params.id);
    await websiteRepository.deleteWebsite(params.id, auth.userId);

    return success(c, null, 'Website and all associated reports deleted successfully');
  } catch (err) {
    return error(c, 'Failed to delete website', 500);
  }
};

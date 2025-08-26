import type { Context } from 'hono';
import { success, error } from '@/utils/response.js';
import type { Variables } from '@/types/index.js';

type AuthContext = Context<{ Variables: Variables }>;

export const healthCheck = async (c: Context) => {
  return success(c, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'lighthouse-analytics-api',
    version: '1.0.0',
  });
};

export const getCurrentUser = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    
    if (!auth) {
      return error(c, 'Unauthorized', 401);
    }

    const { user } = auth;

    return success(c, {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt),
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt) : null,
    });
  } catch (err) {
    return error(c, 'Failed to get user information', 500);
  }
};

export const getUserById = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    
    if (!auth) {
      return error(c, 'Unauthorized', 401);
    }

    const requestedUserId = c.req.param('id');
    
    // For now, users can only get their own info
    if (requestedUserId !== auth.userId) {
      return error(c, 'Forbidden', 403);
    }

    const { user } = auth;

    return success(c, {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt),
    });
  } catch (err) {
    return error(c, 'Failed to get user information', 500);
  }
};

export const verifyToken = async (c: AuthContext) => {
  try {
    const auth = c.get('auth');
    
    if (!auth) {
      return error(c, 'Invalid or expired token', 401);
    }

    return success(c, {
      valid: true,
      userId: auth.userId,
      sessionId: auth.sessionId,
    });
  } catch (err) {
    return error(c, 'Token verification failed', 500);
  }
};
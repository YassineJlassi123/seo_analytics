import type { MiddlewareHandler } from 'hono';
import { unauthorized } from '@/utils/response.js';
import { createClerkClient } from '@clerk/backend';
import type { Variables } from '@/types/index.js';
import { env } from '@/config/env.js';

const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,

});

export const clerkAuth: MiddlewareHandler<{ Variables: Variables }> = async (c, next) => {
  try {
    const request = c.req.raw;
    
    
    const requestState = await clerk.authenticateRequest(request);
    

    if (!requestState.isSignedIn) {
      return unauthorized(c, 'Unauthorized - user not signed in');
    }

    const auth = requestState.toAuth();
    
    if (!auth.userId) {
      return unauthorized(c, 'Invalid user session');
    }

    const user = await clerk.users.getUser(auth.userId);

    c.set('auth', {
      user,
      userId: auth.userId,
      sessionId: auth.sessionId || '', 
    });

    return await next();
  } catch (err) {
    return unauthorized(c, 'Authentication failed');
  }
};
import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return c.json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten(),
    }, 422);
  }

  if (err.message?.includes('Clerk') || err.message?.includes('auth')) {
    return c.json({
      success: false,
      message: 'Authentication failed',
      error: env.NODE_ENV === 'development' ? err.message : undefined,
    }, 401);
  }

  if (err.message?.includes('not found')) {
    return c.json({
      success: false,
      message: err.message || 'Resource not found',
    }, 404);
  }

  return c.json({
    success: false,
    message: 'Internal server error',
    error: env.NODE_ENV === 'development' ? err.message : undefined,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  }, 500);
};
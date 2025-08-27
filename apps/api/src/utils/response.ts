import type { Context } from 'hono';
import type { SuccessResponse, ErrorResponse } from '@/types/index.js';

export const success = <T = any>(
  c: Context,
  data: T,
  message?: string,
  status = 200
) => {
  return c.json<SuccessResponse<T>>(
    {
      success: true,
      data,
      message,
    },
    { status: status as any } 
  );
};

export const error = (
  c: Context,
  message: string,
  status = 400,
  details?: any
) => {
  return c.json<ErrorResponse>(
    {
      success: false,
      message,
      details,
    },
    { status: status as any } 
  );
};

export const notFound = (c: Context, message = 'Resource not found') => {
  return error(c, message, 404);
};

export const unauthorized = (c: Context, message = 'Unauthorized') => {
  return error(c, message, 401);
};

export const forbidden = (c: Context, message = 'Forbidden') => {
  return error(c, message, 403);
};

export const validationError = (c: Context, errors: any) => {
  return error(c, 'Validation failed', 422, errors);
};

export const serverError = (
  c: Context,
  err: Error,
  message = 'Internal server error'
) => {
  console.error('Server error:', err);
  return error(
    c,
    message,
    500,
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
};

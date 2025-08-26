import type { MiddlewareHandler } from 'hono';
import { z, ZodObject } from 'zod';
import { validationError } from '@/utils/response.js';

type ValidationTarget = 'json' | 'query' | 'param';

export const validate = <T extends ZodObject<any>>(
  schema: T,
  target: ValidationTarget = 'json'
): MiddlewareHandler => {
  return async (c, next) => {
    try {
      let data: any = {};

      switch (target) {
        case 'json':
          data = await c.req.json().catch(() => ({}));
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          const keys = Object.keys(schema.shape);
          keys.forEach(key => {
            data[key] = c.req.param(key);
          });
          break;
        default:
          throw new Error(`Invalid validation target: ${target}`);
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        return validationError(c, result.error.flatten());
      }

      c.set('validatedData', result.data);
      return next();
    } catch (err) {
      return validationError(c, 'Validation failed');
    }
  };
};

export const getValidatedData = <T>(c: any): T => {
  return c.get('validatedData') as T;
};

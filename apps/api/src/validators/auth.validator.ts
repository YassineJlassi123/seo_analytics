import { z } from 'zod';
import { 
  uuidSchema, 
  emailSchema, 
  shortTextSchema, 
  optionalShortTextSchema,
  phoneSchema 
} from './common.validator.js';

// User profile schemas
export const userProfileSchema = z.object({
  firstName: optionalShortTextSchema,
  lastName: optionalShortTextSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  imageUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const updateUserProfileSchema = z.object({
  firstName: optionalShortTextSchema,
  lastName: optionalShortTextSchema,
  phone: phoneSchema.optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

// API key schemas
export const createApiKeySchema = z.object({
  name: shortTextSchema,
  description: z.string().max(255).optional(),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).default(['read']),
  expiresAt: z.coerce.date().optional(),
});

export const updateApiKeySchema = z.object({
  name: optionalShortTextSchema,
  description: z.string().max(255).optional(),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).optional(),
  expiresAt: z.coerce.date().optional(),
});

// Session management schemas
export const sessionSchema = z.object({
  sessionId: uuidSchema,
  userId: uuidSchema,
  expiresAt: z.coerce.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: shortTextSchema,
  lastName: shortTextSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine(
  data => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Email verification schemas
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const verify2FASchema = z.object({
  token: z.string()
    .length(6, 'Token must be 6 digits')
    .regex(/^\d{6}$/, 'Token must contain only numbers'),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z.string()
    .length(6, 'Token must be 6 digits')
    .regex(/^\d{6}$/, 'Token must contain only numbers'),
});

// Social login schemas
export const socialLoginSchema = z.object({
  provider: z.enum(['google', 'github', 'microsoft']),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
  redirectUri: z.string().url().optional(),
});

// Webhook schemas
export const webhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.enum([
    'user.created',
    'user.updated',
    'user.deleted',
    'session.created',
    'session.expired',
    'password.changed',
    'email.verified',
    '2fa.enabled',
    '2fa.disabled',
  ])),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  isActive: z.boolean().default(true),
});

export const roleSchema = z.enum(['admin', 'user', 'guest']);

export const permissionSchema = z.enum([
  'read:profile',
  'write:profile',
  'read:websites',
  'write:websites',
  'delete:websites',
  'read:reports',
  'write:reports',
  'delete:reports',
  'admin:users',
  'admin:system',
]);

export const userRoleSchema = z.object({
  userId: uuidSchema,
  role: roleSchema,
  permissions: z.array(permissionSchema).default([]),
  assignedBy: uuidSchema,
  assignedAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce.date().optional(),
});

// Audit log schemas
export const auditLogSchema = z.object({
  userId: uuidSchema,
  action: z.string(),
  resource: z.string(),
  resourceId: uuidSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
    ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))|(([0-9a-fA-F]{1,4}:){6}(:[0-9a-fA-F]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-fA-F]{1,4}:){5}(((:[0-9a-fA-F]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-fA-F]{1,4}:){4}(((:[0-9a-fA-F]{1,4}){1,3})|((:[0-9a-fA-F]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){3}(((:[0-9a-fA-F]{1,4}){1,4})|((:[0-9a-fA-F]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){2}(((:[0-9a-fA-F]{1,4}){1,5})|((:[0-9a-fA-F]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){1}(((:[0-9a-fA-F]{1,4}){1,6})|((:[0-9a-fA-F]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-fA-F]{1,4}){1,7})|((:[0-9a-fA-F]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))$/, "Invalid IP address").nullable(),
  userAgent: z.string().optional(),
  timestamp: z.coerce.date().default(() => new Date()),
});

// Parameter schemas for routes

export const sessionIdParamSchema = z.object({
  sessionId: uuidSchema,
});

export const apiKeyIdParamSchema = z.object({
  keyId: uuidSchema,
});

// Query schemas
export const getUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'lastSignInAt', 'email']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const getSessionsQuerySchema = z.object({
  userId: uuidSchema.optional(),
  isActive: z.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export const getAuditLogsQuerySchema = z.object({
  userId: uuidSchema.optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export const userResponseSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  fullName: z.string(),
  imageUrl: z.string().url().nullable(),
  isEmailVerified: z.boolean(),
  has2FAEnabled: z.boolean(),
  role: roleSchema,
  permissions: z.array(permissionSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastSignInAt: z.coerce.date().nullable(),
});

export const sessionResponseSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  lastActivity: z.coerce.date(),
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))|(([0-9a-fA-F]{1,4}:){6}(:[0-9a-fA-F]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-fA-F]{1,4}:){5}(((:[0-9a-fA-F]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-fA-F]{1,4}:){4}(((:[0-9a-fA-F]{1,4}){1,3})|((:[0-9a-fA-F]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){3}(((:[0-9a-fA-F]{1,4}){1,4})|((:[0-9a-fA-F]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){2}(((:[0-9a-fA-F]{1,4}){1,5})|((:[0-9a-fA-F]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){1}(((:[0-9a-fA-F]{1,4}){1,6})|((:[0-9a-fA-F]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-fA-F]{1,4}){1,7})|((:[0-9a-fA-F]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))$/, "Invalid IP address").nullable(),
  userAgent: z.string().nullable(),
});

export const apiKeyResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(permissionSchema),
  lastUsedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  isActive: z.boolean(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
export type UpdateApiKey = z.infer<typeof updateApiKeySchema>;
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type Enable2FA = z.infer<typeof enable2FASchema>;
export type Verify2FA = z.infer<typeof verify2FASchema>;
export type SocialLogin = z.infer<typeof socialLoginSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type ApiKeyResponse = z.infer<typeof apiKeyResponseSchema>;
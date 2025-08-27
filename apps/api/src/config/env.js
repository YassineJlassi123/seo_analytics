"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var zod_1 = require("zod");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3001'),
    CLERK_SECRET_KEY: zod_1.z.string(),
    CLERK_PUBLISHABLE_KEY: zod_1.z.string(),
    DATABASE_URL: zod_1.z.string(),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    CRON_ENABLED: zod_1.z.string().transform(function (val) { return val === 'true'; }).default(false),
    LIGHTHOUSE_BATCH_SIZE: zod_1.z.string().transform(Number).default(5),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
});
exports.env = envSchema.parse(process.env);

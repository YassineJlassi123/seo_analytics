import { serve } from '@hono/node-server';
import app from '@/app.js';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';
import '@/services/queue.service.js'; 

const port = parseInt(env.PORT);

const server = serve({
  fetch: app.fetch,
  port,
}, (info) => {
  logger.info(`🚀 Server running at http://localhost:${info.port}`);
  logger.info(`📝 API Documentation: http://localhost:${info.port}/api`);
  logger.info(`🔧 RPC Endpoint: http://localhost:${info.port}/rpc`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
   
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
export type { AppType } from '@/app.js';

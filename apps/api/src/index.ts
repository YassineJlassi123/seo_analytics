import { serve } from '@hono/node-server';
import app from '@/app.js';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';
import '@/services/queue.service.js'; // This will initialize and start the BullMQ worker

const port = parseInt(env.PORT);

// Start server
const server = serve({
  fetch: app.fetch,
  port,
}, (info) => {
  logger.info(`🚀 Server running at http://localhost:${info.port}`);
  logger.info(`📝 API Documentation: http://localhost:${info.port}/api`);
  logger.info(`🔧 RPC Endpoint: http://localhost:${info.port}/rpc`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // The BullMQ worker will disconnect gracefully
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
export type { AppType } from '@/app.js';

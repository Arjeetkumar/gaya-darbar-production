import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedTablesIfEmpty } from './services/tableService.js';
import { logger } from './utils/logger.js';

const PORT = config.port;

async function startServer() {
  // Attempt database connection
  await connectDatabase();

  // Ensure default Gaya Darbar tables exist in database
  try {
    await seedTablesIfEmpty();
  } catch (err) {
    logger.warn(`Failed to seed default tables: ${(err as Error).message}`);
  }

  const server = app.listen(PORT, () => {
    logger.info(`===================================================`);
    logger.info(` Gaya Darbar — Iron & Fuel House API Backend Server `);
    logger.info(`===================================================`);
    logger.info(` Environment : ${config.nodeEnv}`);
    logger.info(` Health Check: http://localhost:${PORT}/api/health`);
    logger.info(` API v1      : http://localhost:${PORT}/api/v1`);
    logger.info(` Allowed CORS: ${config.clientUrl}`);
    logger.info(`===================================================`);
  });

  // Graceful shutdown handler
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received. Closing HTTP server gracefully...');
    server.close(async () => {
      await disconnectDatabase();
      logger.info('HTTP server and database connections closed cleanly.');
      process.exit(0);
    });
  });
}

startServer();

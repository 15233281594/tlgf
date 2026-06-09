import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './core/logger.js';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  logger.info(`${config.app.name} listening on http://${config.host}:${config.port}`);
});

const shutdown = (signal) => {
  logger.info(`received ${signal}, shutting down`);
  server.close((error) => {
    if (error) {
      logger.error('shutdown failed', { error: error.message });
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

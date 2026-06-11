// HTTP 服务启动入口，负责监听端口、记录数据库状态和优雅退出。
import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './core/logger.js';
import { checkDatabaseConnection, closeDatabaseConnections } from './db/index.js';

const app = createApp();

async function logDatabaseStatus() {
  const database = await checkDatabaseConnection();

  if (database.status === 'ok') {
    logger.info('数据库连接成功', {
      database: config.database.name,
      host: config.database.host
    });
    return;
  }

  if (database.status === 'not_configured') {
    logger.warn('数据库未配置，请检查 server/.env');
    return;
  }

  logger.error('数据库连接失败', {
    code: database.code
  });
}

const server = app.listen(config.port, config.host, () => {
  logger.info(`${config.app.name} listening on http://${config.host}:${config.port}`);
  void logDatabaseStatus();
});

const shutdown = (signal) => {
  logger.info(`received ${signal}, shutting down`);
  server.close(async (error) => {
    if (error) {
      logger.error('shutdown failed', { error: error.message });
      process.exit(1);
    }

    try {
      await closeDatabaseConnections();
      process.exit(0);
    } catch (closeError) {
      logger.error('database shutdown failed', { error: closeError.message });
      process.exit(1);
    }
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

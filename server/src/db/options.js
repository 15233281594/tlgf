// 生成数据库连接参数，供 mysql2 初始化脚本和 Sequelize 共同复用。
import { readFileSync } from 'node:fs';
import { config } from '../config/index.js';

export function isDatabaseConfigured() {
  return Boolean(config.database.host && config.database.user && config.database.name);
}

export function getDatabaseSslOptions() {
  if (!config.database.ssl) {
    return undefined;
  }

  const sslOptions = {
    minVersion: 'TLSv1.2'
  };

  if (config.database.sslCaPath) {
    sslOptions.ca = readFileSync(config.database.sslCaPath, 'utf8');
  }

  return sslOptions;
}

export function getDatabaseConnectionOptions({ includeDatabase = true, multipleStatements = false } = {}) {
  if (!isDatabaseConfigured()) {
    throw new Error('Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.');
  }

  return {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: includeDatabase ? config.database.name : undefined,
    waitForConnections: true,
    connectionLimit: config.database.connectionLimit,
    connectTimeout: config.database.connectTimeoutMs,
    multipleStatements,
    ssl: getDatabaseSslOptions()
  };
}

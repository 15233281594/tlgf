// 创建并缓存 Sequelize 实例，统一管理 ORM 连接池。
import { Sequelize } from 'sequelize';
import { config } from '../config/index.js';
import { getDatabaseSslOptions, isDatabaseConfigured } from './options.js';

let sequelize;

export function getSequelize() {
  if (!isDatabaseConfigured()) {
    throw new Error('Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.');
  }

  if (!sequelize) {
    const dialectOptions = {
      connectTimeout: config.database.connectTimeoutMs
    };
    const ssl = getDatabaseSslOptions();

    if (ssl) {
      dialectOptions.ssl = ssl;
    }

    sequelize = new Sequelize(config.database.name, config.database.user, config.database.password, {
      dialect: 'mysql',
      host: config.database.host,
      port: config.database.port,
      logging: false,
      pool: {
        max: config.database.connectionLimit,
        min: 0,
        acquire: config.database.connectTimeoutMs,
        idle: 10000
      },
      dialectOptions,
      define: {
        freezeTableName: true,
        underscored: true
      }
    });
  }

  return sequelize;
}

export async function closeSequelize() {
  if (!sequelize) {
    return;
  }

  await sequelize.close();
  sequelize = undefined;
}

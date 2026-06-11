// 暴露数据库统一入口，兼容初始化脚本的 mysql2 和业务层 Sequelize。
import mysql from 'mysql2/promise';
import {
  getDatabaseConnectionOptions,
  getDatabaseSslOptions,
  isDatabaseConfigured
} from './options.js';
import { closeSequelize } from './sequelize.js';
import { authenticateModels } from '../models/index.js';

let pool;

export function getDatabasePool() {
  if (!pool) {
    pool = mysql.createPool(getDatabaseConnectionOptions());
  }

  return pool;
}

function getDatabaseErrorCode(error) {
  return error.parent?.code ?? error.original?.code ?? error.code ?? 'DB_ERROR';
}

export async function checkDatabaseConnection() {
  if (!isDatabaseConfigured()) {
    return {
      status: 'not_configured'
    };
  }

  try {
    await authenticateModels();

    return {
      status: 'ok'
    };
  } catch (error) {
    return {
      status: 'error',
      code: getDatabaseErrorCode(error)
    };
  }
}

export async function closeDatabaseConnections() {
  const tasks = [closeSequelize()];

  if (pool) {
    tasks.push(
      pool.end().finally(() => {
        pool = undefined;
      })
    );
  }

  await Promise.all(tasks);
}

export { getDatabaseConnectionOptions, getDatabaseSslOptions, isDatabaseConfigured };

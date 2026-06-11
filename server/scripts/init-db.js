// 执行 SQL 初始化脚本，创建后端所需数据库表。
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config/index.js';
import { getDatabaseConnectionOptions, isDatabaseConfigured } from '../src/db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const initSqlPath = resolve(__dirname, '../sql/001_init.sql');

if (!isDatabaseConfigured()) {
  throw new Error('Database is not configured. Fill DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME before running db:init.');
}

const sql = (await readFile(initSqlPath, 'utf8')).replaceAll('`tlgf`', `\`${config.database.name}\``);
const connection = await mysql.createConnection(
  getDatabaseConnectionOptions({
    includeDatabase: false,
    multipleStatements: true
  })
);

try {
  await connection.query(sql);
  console.log(`Database initialized: ${config.database.name}`);
} finally {
  await connection.end();
}

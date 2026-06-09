import { readBooleanEnv, readEnv, readNumberEnv } from './env.js';

const readListEnv = (name, fallback) =>
  readEnv(name, fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

export const config = Object.freeze({
  nodeEnv: readEnv('NODE_ENV', 'development'),
  host: readEnv('HOST', '127.0.0.1'),
  port: readNumberEnv('PORT', 3000),
  app: {
    name: readEnv('APP_NAME', 'tlgf-server'),
    version: readEnv('APP_VERSION', '0.1.0')
  },
  request: {
    bodyLimit: readEnv('REQUEST_BODY_LIMIT', '100kb')
  },
  cors: {
    origins: readListEnv('CORS_ORIGINS', 'http://localhost:5173,https://aiyahmiro.cn,https://www.aiyahmiro.cn')
  },
  database: {
    host: readEnv('DB_HOST', ''),
    port: readNumberEnv('DB_PORT', 4000),
    user: readEnv('DB_USER', ''),
    password: readEnv('DB_PASSWORD', ''),
    name: readEnv('DB_NAME', 'tlgf'),
    ssl: readBooleanEnv('DB_SSL', true),
    sslCaPath: readEnv('DB_SSL_CA_PATH', ''),
    connectionLimit: readNumberEnv('DB_CONNECTION_LIMIT', 10),
    connectTimeoutMs: readNumberEnv('DB_CONNECT_TIMEOUT_MS', 10000)
  }
});

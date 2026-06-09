import { readEnv, readNumberEnv } from './env.js';

export const config = Object.freeze({
  nodeEnv: readEnv('NODE_ENV', 'development'),
  host: readEnv('HOST', '127.0.0.1'),
  port: readNumberEnv('PORT', 3000),
  app: {
    name: readEnv('APP_NAME', 'tlgf-server'),
    version: readEnv('APP_VERSION', '0.1.0')
  },
  cors: {
    origin: readEnv('CORS_ORIGIN', 'http://localhost:5173')
  }
});

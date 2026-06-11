// Express 应用组装入口，负责注册安全头、中间件、路由和统一错误处理。
import express from 'express';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { apiRouter } from './routes/index.js';

function applySecurityHeaders(_req, res, next) {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.header('Cross-Origin-Resource-Policy', 'same-site');
  next();
}

function applyCors(req, res, next) {
  const origin = req.header('Origin');

  if (origin && config.cors.origins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Request-Id');

  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && !config.cors.origins.includes(origin) ? 403 : 204);
    return;
  }

  next();
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(applySecurityHeaders);
  app.use(express.json({ limit: config.request.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.request.bodyLimit }));
  app.use(applyCors);

  app.use(requestLogger);
  app.use('/api', apiRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        message: 'Route not found',
        statusCode: 404
      }
    });
  });

  app.use(errorHandler);

  return app;
}

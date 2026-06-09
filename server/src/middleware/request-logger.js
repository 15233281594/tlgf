import { logger } from '../core/logger.js';

export function requestLogger(req, res, next) {
  const startedAt = performance.now();

  res.on('finish', () => {
    logger.info('request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    });
  });

  next();
}

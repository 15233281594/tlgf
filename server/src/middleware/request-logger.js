// 记录每次接口请求的状态码、耗时和基础访问信息。
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

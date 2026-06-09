import { HttpError } from '../core/errors.js';
import { logger } from '../core/logger.js';

export function errorHandler(error, _req, res, _next) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  if (statusCode === 500) {
    logger.error(message, { error: error.message });
  }

  res.status(statusCode).json({
    error: {
      message,
      statusCode
    }
  });
}

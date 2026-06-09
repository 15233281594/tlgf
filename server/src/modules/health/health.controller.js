import { config } from '../../config/index.js';

export function getHealth(_req, res) {
  res.status(200).json({
    status: 'ok',
    service: config.app.name,
    version: config.app.version,
    environment: config.nodeEnv,
    uptimeSeconds: Math.round(process.uptime())
  });
}

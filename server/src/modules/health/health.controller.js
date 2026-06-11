// 提供服务健康检查接口。
import { config } from '../../config/index.js';
import { checkDatabaseConnection } from '../../db/index.js';

export async function getHealth(_req, res) {
  const database = await checkDatabaseConnection();

  res.status(200).json({
    status: 'ok',
    service: config.app.name,
    version: config.app.version,
    environment: config.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    database
  });
}

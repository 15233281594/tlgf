// 封装后台审计日志的数据写入和查询逻辑。
import { getModels } from '../../models/index.js';

function toAuditLog(log) {
  const data = log.get({ plain: true });

  return {
    id: data.id,
    adminUserId: data.adminUserId,
    adminEmail: data.adminEmail,
    adminName: data.adminName,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    targetLabel: data.targetLabel,
    detail: data.detail,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    createdAt: data.created_at
  };
}

export async function createAuditLog(payload) {
  const { AdminAuditLog } = getModels();

  await AdminAuditLog.create(payload);
}

export async function listAuditLogs({ limit = 50, offset = 0 } = {}) {
  const { AdminAuditLog } = getModels();
  const logs = await AdminAuditLog.findAll({
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return logs.map(toAuditLog);
}

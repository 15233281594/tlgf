// 提供后台审计日志查询接口。
import { getAuditActionLabel } from './audit.actions.js';
import { listAuditLogs } from './audit.repository.js';

function normalizeLimit(value) {
  const limit = Number(value);

  if (!Number.isInteger(limit) || limit <= 0) {
    return 50;
  }

  return Math.min(limit, 100);
}

function normalizeOffset(value) {
  const offset = Number(value);

  if (!Number.isInteger(offset) || offset < 0) {
    return 0;
  }

  return offset;
}

function serializeAuditLog(log) {
  return {
    ...log,
    actionLabel: getAuditActionLabel(log.action)
  };
}

export async function listAdminAuditLogs(req, res) {
  const logs = await listAuditLogs({
    limit: normalizeLimit(req.query.limit),
    offset: normalizeOffset(req.query.offset)
  });

  res.status(200).json({
    logs: logs.map(serializeAuditLog)
  });
}

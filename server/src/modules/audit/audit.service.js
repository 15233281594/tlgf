// 提供后台审计日志记录服务，统一从请求中提取操作人和客户端信息。
import { logger } from '../../core/logger.js';
import { createAuditLog } from './audit.repository.js';

function normalizeActor(actor) {
  if (!actor) {
    return {
      adminUserId: null,
      adminEmail: null,
      adminName: null
    };
  }

  return {
    adminUserId: actor.id ?? null,
    adminEmail: actor.email ?? null,
    adminName: actor.name ?? null
  };
}

function readIpAddress(req) {
  return req.ip?.slice(0, 64) ?? null;
}

function readUserAgent(req) {
  return req.header('User-Agent')?.slice(0, 255) ?? null;
}

export async function recordAuditLog(req, options) {
  const actor = normalizeActor(options.actor ?? req.admin);

  try {
    await createAuditLog({
      ...actor,
      action: options.action,
      targetType: options.targetType ?? null,
      targetId: options.targetId ? String(options.targetId).slice(0, 64) : null,
      targetLabel: options.targetLabel ? String(options.targetLabel).slice(0, 128) : null,
      detail: options.detail ?? null,
      ipAddress: readIpAddress(req),
      userAgent: readUserAgent(req)
    });
  } catch (error) {
    logger.warn('Audit log write failed', {
      action: options.action,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

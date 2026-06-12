// 提供后台管理员接口鉴权中间件。
import { config } from '../../config/index.js';
import { HttpError } from '../../core/errors.js';
import { hasRolePermission } from '../roles/role.service.js';
import { findAdminBySessionToken } from './auth.repository.js';
import { readCookie } from './cookie.js';

async function resolveAdmin(req) {
  if (req.admin) {
    return req.admin;
  }

  const token = readCookie(req, config.auth.sessionCookieName);
  const admin = await findAdminBySessionToken(token);

  if (admin) {
    req.admin = admin;
  }

  return admin;
}

export async function requireAdmin(req, _res, next) {
  try {
    const admin = await resolveAdmin(req);

    if (!admin) {
      throw new HttpError(401, '请先登录后台');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(permission) {
  return async (req, _res, next) => {
    try {
      const admin = await resolveAdmin(req);

      if (!admin) {
        throw new HttpError(401, '请先登录后台');
      }

      if (!(await hasRolePermission(admin.role, permission))) {
        throw new HttpError(403, '当前账号没有该操作权限');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// 提供后台管理员接口鉴权中间件。
import { config } from '../../config/index.js';
import { HttpError } from '../../core/errors.js';
import { findAdminBySessionToken } from './auth.repository.js';
import { readCookie } from './cookie.js';

export async function requireAdmin(req, _res, next) {
  try {
    const token = readCookie(req, config.auth.sessionCookieName);
    const admin = await findAdminBySessionToken(token);

    if (!admin) {
      throw new HttpError(401, '请先登录后台');
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}

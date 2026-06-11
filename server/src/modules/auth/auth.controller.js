// 处理后台管理员登录、当前会话查询和退出登录接口。
import { config } from '../../config/index.js';
import { HttpError } from '../../core/errors.js';
import { clearSessionCookie, readCookie, setSessionCookie } from './cookie.js';
import {
  createAdminSession,
  findAdminByEmail,
  findAdminBySessionToken,
  markAdminLogin,
  revokeAdminSession
} from './auth.repository.js';
import { verifyPassword } from './password.js';

function serializeAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role
  };
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, '请输入邮箱和密码');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = await findAdminByEmail(normalizedEmail);
  const passwordValid = admin ? await verifyPassword(password, admin.password_hash) : false;

  if (!admin || !passwordValid) {
    throw new HttpError(401, '账号或密码错误');
  }

  if (!admin.is_active) {
    throw new HttpError(403, '账号已停用');
  }

  const token = await createAdminSession({
    adminUserId: admin.id,
    ipAddress: req.ip,
    userAgent: req.header('User-Agent')
  });

  await markAdminLogin(admin.id);
  setSessionCookie(res, token);

  res.status(200).json({
    authenticated: true,
    user: serializeAdmin(admin)
  });
}

export async function getCurrentAdmin(req, res) {
  const token = readCookie(req, config.auth.sessionCookieName);
  const admin = await findAdminBySessionToken(token);

  if (!admin) {
    res.status(200).json({
      authenticated: false,
      user: null
    });
    return;
  }

  res.status(200).json({
    authenticated: true,
    user: serializeAdmin(admin)
  });
}

export async function logout(req, res) {
  const token = readCookie(req, config.auth.sessionCookieName);

  await revokeAdminSession(token);
  clearSessionCookie(res);

  res.status(200).json({
    authenticated: false
  });
}

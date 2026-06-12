// 处理后台管理员登录、当前会话查询和退出登录接口。
import { config } from '../../config/index.js';
import { HttpError } from '../../core/errors.js';
import { auditActions } from '../audit/audit.actions.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { getPermissionsForRole, isKnownRole } from '../roles/role.service.js';
import { clearSessionCookie, readCookie, setSessionCookie } from './cookie.js';
import {
  createAdminSession,
  findAdminByEmail,
  findAdminById,
  findAdminBySessionToken,
  markAdminLogin,
  revokeAdminSession,
  updateAdminPassword,
  updateAdminProfile
} from './auth.repository.js';
import { hashPassword, verifyPassword } from './password.js';

async function serializeAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: await getPermissionsForRole(admin.role)
  };
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    throw new HttpError(400, '请输入姓名');
  }

  const normalizedName = name.trim();

  if (!normalizedName || normalizedName.length > 64) {
    throw new HttpError(400, '姓名长度需要在 1 到 64 个字符之间');
  }

  return normalizedName;
}

function normalizePassword(password, message) {
  if (typeof password !== 'string' || password.trim().length < 8 || password.length > 72) {
    throw new HttpError(400, message);
  }

  return password;
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

  if (!(await isKnownRole(admin.role))) {
    throw new HttpError(403, '当前账号角色已停用');
  }

  const token = await createAdminSession({
    adminUserId: admin.id,
    ipAddress: req.ip,
    userAgent: req.header('User-Agent')
  });

  await markAdminLogin(admin.id);
  setSessionCookie(res, token);
  await recordAuditLog(req, {
    actor: admin,
    action: auditActions.authLogin,
    targetType: 'admin_user',
    targetId: admin.id,
    targetLabel: admin.email
  });

  res.status(200).json({
    authenticated: true,
    user: await serializeAdmin(admin)
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
    user: await serializeAdmin(admin)
  });
}

export async function logout(req, res) {
  const token = readCookie(req, config.auth.sessionCookieName);
  const admin = await findAdminBySessionToken(token);

  await revokeAdminSession(token);
  clearSessionCookie(res);

  if (admin) {
    await recordAuditLog(req, {
      actor: admin,
      action: auditActions.authLogout,
      targetType: 'admin_user',
      targetId: admin.id,
      targetLabel: admin.email
    });
  }

  res.status(200).json({
    authenticated: false
  });
}

export async function updateCurrentAdminProfile(req, res) {
  const name = normalizeName(req.body?.name);
  const beforeAdmin = await findAdminById(req.admin.id);
  const admin = await updateAdminProfile(req.admin.id, {
    name
  });
  await recordAuditLog(req, {
    actor: admin,
    action: auditActions.authProfileUpdate,
    targetType: 'admin_user',
    targetId: admin.id,
    targetLabel: admin.email,
    detail: {
      before: {
        name: beforeAdmin?.name
      },
      after: {
        name: admin.name
      }
    }
  });

  res.status(200).json({
    authenticated: true,
    user: await serializeAdmin(admin)
  });
}

export async function changeCurrentAdminPassword(req, res) {
  const currentPassword = normalizePassword(req.body?.currentPassword, '请输入当前密码');
  const newPassword = normalizePassword(req.body?.newPassword, '新密码长度需要在 8 到 72 个字符之间');
  const admin = await findAdminById(req.admin.id);

  if (!admin || !admin.is_active) {
    throw new HttpError(401, '请先登录后台');
  }

  const passwordValid = await verifyPassword(currentPassword, admin.password_hash);

  if (!passwordValid) {
    throw new HttpError(401, '当前密码错误');
  }

  if (currentPassword === newPassword) {
    throw new HttpError(400, '新密码不能和当前密码一致');
  }

  const passwordHash = await hashPassword(newPassword);
  const updatedAdmin = await updateAdminPassword(req.admin.id, passwordHash);
  await recordAuditLog(req, {
    actor: updatedAdmin,
    action: auditActions.authPasswordChange,
    targetType: 'admin_user',
    targetId: updatedAdmin.id,
    targetLabel: updatedAdmin.email
  });

  res.status(200).json({
    authenticated: true,
    user: await serializeAdmin(updatedAdmin)
  });
}

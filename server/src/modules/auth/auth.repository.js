// 封装后台管理员账号和会话的数据访问逻辑。
import { createHash, randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { config } from '../../config/index.js';
import { getModels } from '../../models/index.js';

const sessionTokenBytes = 32;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function toLegacyAdmin(admin) {
  if (!admin) {
    return null;
  }

  const data = admin.get({ plain: true });

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    password_hash: data.passwordHash,
    role: data.role,
    is_active: data.isActive,
    last_login_at: data.lastLoginAt
  };
}

export async function findAdminByEmail(email) {
  const { AdminUser } = getModels();
  const admin = await AdminUser.findOne({
    where: {
      email
    },
    attributes: ['id', 'email', 'name', 'passwordHash', 'role', 'isActive']
  });

  return toLegacyAdmin(admin);
}

export async function createAdminSession({ adminUserId, ipAddress, userAgent }) {
  const { AdminSession } = getModels();
  const token = randomBytes(sessionTokenBytes).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.auth.sessionTtlDays * 24 * 60 * 60 * 1000);

  await AdminSession.create({
    adminUserId,
    tokenHash,
    ipAddress: ipAddress?.slice(0, 64) ?? null,
    userAgent: userAgent?.slice(0, 255) ?? null,
    expiresAt
  });

  return token;
}

export async function findAdminBySessionToken(token) {
  if (!token) {
    return null;
  }

  const { AdminSession, AdminUser } = getModels();
  const session = await AdminSession.findOne({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: {
        [Op.gt]: new Date()
      }
    },
    include: [
      {
        model: AdminUser,
        as: 'adminUser',
        required: true,
        where: {
          isActive: true
        },
        attributes: ['id', 'email', 'name', 'role']
      }
    ]
  });

  if (!session) {
    return null;
  }

  await session.update({
    lastSeenAt: new Date()
  });

  const admin = session.adminUser.get({ plain: true });

  return {
    session_id: session.id,
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role
  };
}

export async function revokeAdminSession(token) {
  if (!token) {
    return;
  }

  const { AdminSession } = getModels();

  await AdminSession.update(
    {
      revokedAt: new Date()
    },
    {
      where: {
        tokenHash: hashToken(token),
        revokedAt: null
      }
    }
  );
}

export async function markAdminLogin(adminUserId) {
  const { AdminUser } = getModels();

  await AdminUser.update(
    {
      lastLoginAt: new Date()
    },
    {
      where: {
        id: adminUserId
      }
    }
  );
}

export async function upsertAdminUser({ email, name, passwordHash, role = 'super_admin' }) {
  const { AdminUser } = getModels();

  await AdminUser.upsert({
    email,
    name,
    passwordHash,
    role,
    isActive: true
  });
}

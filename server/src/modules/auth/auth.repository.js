// 封装后台管理员账号和会话的数据访问逻辑。
import { createHash, randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { config } from '../../config/index.js';
import { getModels } from '../../models/index.js';

const sessionTokenBytes = 32;
const sessionCacheTtlMs = 30 * 1000;
const lastSeenWriteIntervalMs = 60 * 1000;
const sessionCache = new Map();
const lastSeenWriteAtByTokenHash = new Map();

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function cloneAdminSession(admin) {
  return admin ? { ...admin } : null;
}

function readCachedSession(tokenHash) {
  const cached = sessionCache.get(tokenHash);

  if (!cached || cached.cacheExpiresAt <= Date.now()) {
    sessionCache.delete(tokenHash);
    return null;
  }

  return cloneAdminSession(cached.admin);
}

function writeCachedSession(tokenHash, admin, sessionExpiresAt) {
  sessionCache.set(tokenHash, {
    admin: cloneAdminSession(admin),
    cacheExpiresAt: Math.min(Date.now() + sessionCacheTtlMs, sessionExpiresAt.getTime())
  });
}

function shouldWriteLastSeen(tokenHash) {
  const now = Date.now();
  const lastWriteAt = lastSeenWriteAtByTokenHash.get(tokenHash) ?? 0;

  if (now - lastWriteAt < lastSeenWriteIntervalMs) {
    return false;
  }

  lastSeenWriteAtByTokenHash.set(tokenHash, now);
  return true;
}

export function clearAdminSessionCacheByAdminId(adminUserId) {
  for (const [tokenHash, cached] of sessionCache.entries()) {
    if (Number(cached.admin?.id) === Number(adminUserId)) {
      sessionCache.delete(tokenHash);
      lastSeenWriteAtByTokenHash.delete(tokenHash);
    }
  }
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

export async function findAdminById(id) {
  const { AdminUser } = getModels();
  const admin = await AdminUser.findByPk(id, {
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

  const tokenHash = hashToken(token);
  const cachedAdmin = readCachedSession(tokenHash);

  if (cachedAdmin) {
    return cachedAdmin;
  }

  const { AdminSession, AdminUser } = getModels();
  const session = await AdminSession.findOne({
    where: {
      tokenHash,
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

  if (shouldWriteLastSeen(tokenHash)) {
    await session.update({
      lastSeenAt: new Date()
    });
  }

  const admin = session.adminUser.get({ plain: true });

  const adminSession = {
    session_id: session.id,
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role
  };

  writeCachedSession(tokenHash, adminSession, session.expiresAt);

  return cloneAdminSession(adminSession);
}

export async function revokeAdminSession(token) {
  if (!token) {
    return;
  }

  const { AdminSession } = getModels();
  const tokenHash = hashToken(token);

  await AdminSession.update(
    {
      revokedAt: new Date()
    },
    {
      where: {
        tokenHash,
        revokedAt: null
      }
    }
  );

  sessionCache.delete(tokenHash);
  lastSeenWriteAtByTokenHash.delete(tokenHash);
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

export async function updateAdminProfile(adminUserId, { name }) {
  const { AdminUser } = getModels();

  await AdminUser.update(
    {
      name
    },
    {
      where: {
        id: adminUserId
      }
    }
  );

  clearAdminSessionCacheByAdminId(adminUserId);

  return findAdminById(adminUserId);
}

export async function updateAdminPassword(adminUserId, passwordHash) {
  const { AdminUser } = getModels();

  await AdminUser.update(
    {
      passwordHash
    },
    {
      where: {
        id: adminUserId
      }
    }
  );

  clearAdminSessionCacheByAdminId(adminUserId);

  return findAdminById(adminUserId);
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

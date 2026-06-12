// 封装后台成员账号的数据查询逻辑。
import { getModels } from '../../models/index.js';
import { clearAdminSessionCacheByAdminId } from '../auth/auth.repository.js';

const memberAttributes = ['id', 'email', 'name', 'role', 'isActive', 'lastLoginAt', 'created_at', 'updated_at'];

function toAdminMember(member) {
  if (!member) {
    return null;
  }

  const data = member.get({ plain: true });

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    isActive: data.isActive,
    lastLoginAt: data.lastLoginAt,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function listAdminMembers() {
  const { AdminUser } = getModels();
  const members = await AdminUser.findAll({
    attributes: memberAttributes,
    order: [['created_at', 'DESC']]
  });

  return members.map(toAdminMember);
}

export async function findAdminMemberById(id) {
  const { AdminUser } = getModels();
  const member = await AdminUser.findByPk(id, {
    attributes: memberAttributes
  });

  return toAdminMember(member);
}

export async function findAdminMemberByEmail(email) {
  const { AdminUser } = getModels();
  const member = await AdminUser.findOne({
    where: {
      email
    },
    attributes: memberAttributes
  });

  return toAdminMember(member);
}

export async function createAdminMember({ email, name, passwordHash, role }) {
  const { AdminUser } = getModels();
  const member = await AdminUser.create({
    email,
    name,
    passwordHash,
    role,
    isActive: true
  });

  return findAdminMemberById(member.id);
}

export async function updateAdminMember(id, { name, role }) {
  const { AdminUser } = getModels();

  await AdminUser.update(
    {
      name,
      role
    },
    {
      where: {
        id
      }
    }
  );

  clearAdminSessionCacheByAdminId(id);

  return findAdminMemberById(id);
}

export async function updateAdminMemberPassword(id, passwordHash) {
  const { AdminUser } = getModels();

  await AdminUser.update(
    {
      passwordHash
    },
    {
      where: {
        id
      }
    }
  );

  clearAdminSessionCacheByAdminId(id);

  return findAdminMemberById(id);
}

export async function updateAdminMemberStatus(id, isActive) {
  const { AdminUser } = getModels();

  await AdminUser.update(
    {
      isActive
    },
    {
      where: {
        id
      }
    }
  );

  clearAdminSessionCacheByAdminId(id);

  return findAdminMemberById(id);
}

export async function countActiveSuperAdmins() {
  const { AdminUser } = getModels();

  return AdminUser.count({
    where: {
      role: 'super_admin',
      isActive: true
    }
  });
}

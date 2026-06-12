// 封装后台角色和角色权限的数据访问逻辑。
import { getSequelize } from '../../db/sequelize.js';
import { getModels } from '../../models/index.js';

function toRole(role) {
  if (!role) {
    return null;
  }

  const data = role.get({ plain: true });

  return {
    id: data.id,
    key: data.roleKey,
    name: data.name,
    description: data.description ?? '',
    isSystem: data.isSystem,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

function groupPermissions(permissions) {
  return permissions.reduce((map, permission) => {
    const list = map.get(permission.roleKey) ?? [];
    list.push(permission.permissionKey);
    map.set(permission.roleKey, list);
    return map;
  }, new Map());
}

export async function listAdminRoles({ onlyActive = false } = {}) {
  const { AdminRole, AdminRolePermission } = getModels();
  const roles = await AdminRole.findAll({
    where: onlyActive ? { isActive: true } : undefined,
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });
  const permissions = await AdminRolePermission.findAll();
  const permissionsByRole = groupPermissions(permissions.map((permission) => permission.get({ plain: true })));

  return roles.map((role) => ({
    ...toRole(role),
    permissions: permissionsByRole.get(role.roleKey) ?? []
  }));
}

export async function findAdminRoleByKey(roleKey) {
  const { AdminRole, AdminRolePermission } = getModels();
  const role = await AdminRole.findOne({
    where: {
      roleKey
    }
  });

  if (!role) {
    return null;
  }

  const permissions = await AdminRolePermission.findAll({
    where: {
      roleKey
    }
  });

  return {
    ...toRole(role),
    permissions: permissions.map((permission) => permission.permissionKey)
  };
}

export async function createAdminRole(payload) {
  const { AdminRole } = getModels();
  const role = await AdminRole.create({
    roleKey: payload.key,
    name: payload.name,
    description: payload.description,
    isSystem: false,
    isActive: payload.isActive,
    sortOrder: payload.sortOrder
  });

  return findAdminRoleByKey(role.roleKey);
}

export async function updateAdminRole(roleKey, payload) {
  const { AdminRole } = getModels();

  await AdminRole.update(
    {
      name: payload.name,
      description: payload.description,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder
    },
    {
      where: {
        roleKey
      }
    }
  );

  return findAdminRoleByKey(roleKey);
}

export async function updateRolePermissions(roleKey, permissionKeys) {
  const { AdminRolePermission } = getModels();
  const sequelize = getSequelize();

  await sequelize.transaction(async (transaction) => {
    await AdminRolePermission.destroy({
      where: {
        roleKey
      },
      transaction
    });

    if (permissionKeys.length > 0) {
      await AdminRolePermission.bulkCreate(
        permissionKeys.map((permissionKey) => ({
          roleKey,
          permissionKey
        })),
        {
          transaction
        }
      );
    }
  });

  return findAdminRoleByKey(roleKey);
}

export async function deleteAdminRole(roleKey) {
  const { AdminRole } = getModels();

  await AdminRole.destroy({
    where: {
      roleKey
    }
  });
}

export async function countAdminUsersByRole(roleKey) {
  const { AdminUser } = getModels();

  return AdminUser.count({
    where: {
      role: roleKey
    }
  });
}

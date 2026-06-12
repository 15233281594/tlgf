// 提供后台角色、角色权限和角色授权管理接口。
import { HttpError } from '../../core/errors.js';
import { auditActions } from '../audit/audit.actions.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { getPermissionCatalog, isKnownPermission, permissions } from '../auth/permissions.js';
import {
  countAdminUsersByRole,
  createAdminRole,
  deleteAdminRole,
  findAdminRoleByKey,
  updateAdminRole,
  updateRolePermissions
} from './role.repository.js';
import { getRoleSummaries, invalidateRoleCache } from './role.service.js';

const roleKeyPattern = /^[a-z][a-z0-9_]{1,63}$/;

function normalizeRoleKey(roleKey) {
  if (typeof roleKey !== 'string' || !roleKeyPattern.test(roleKey.trim())) {
    throw new HttpError(400, '角色标识只能使用小写字母、数字和下划线，并且需要以字母开头');
  }

  return roleKey.trim();
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    throw new HttpError(400, '请输入角色名称');
  }

  const normalized = name.trim();

  if (!normalized || normalized.length > 64) {
    throw new HttpError(400, '角色名称长度需要在 1 到 64 个字符之间');
  }

  return normalized;
}

function normalizeDescription(description) {
  if (typeof description !== 'string') {
    return '';
  }

  return description.trim().slice(0, 255);
}

function normalizeSortOrder(sortOrder) {
  const normalized = Number(sortOrder);

  if (!Number.isInteger(normalized)) {
    return 0;
  }

  return normalized;
}

function normalizeIsActive(isActive) {
  if (typeof isActive !== 'boolean') {
    return true;
  }

  return isActive;
}

function normalizePermissionKeys(permissionKeys, { allowAll = false } = {}) {
  if (!Array.isArray(permissionKeys)) {
    throw new HttpError(400, '请选择权限点');
  }

  const uniquePermissionKeys = [...new Set(permissionKeys.map((permissionKey) => String(permissionKey).trim()))];

  uniquePermissionKeys.forEach((permissionKey) => {
    if (permissionKey === permissions.all && !allowAll) {
      throw new HttpError(400, '普通角色不能直接授予全部权限');
    }

    if (!isKnownPermission(permissionKey)) {
      throw new HttpError(400, `无效权限点：${permissionKey}`);
    }
  });

  return uniquePermissionKeys;
}

function roleSnapshot(role) {
  return {
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive,
    sortOrder: role.sortOrder,
    permissions: role.permissions
  };
}

async function findRoleOrThrow(roleKey) {
  const role = await findAdminRoleByKey(roleKey);

  if (!role) {
    throw new HttpError(404, '角色不存在');
  }

  return role;
}

async function ensureRoleCanBeInactive(role, nextIsActive) {
  if (nextIsActive) {
    return;
  }

  if (role.isSystem) {
    throw new HttpError(400, '系统角色不能停用');
  }

  const userCount = await countAdminUsersByRole(role.key);

  if (userCount > 0) {
    throw new HttpError(400, '该角色下还有成员，不能停用');
  }
}

export async function listRoles(_req, res) {
  res.status(200).json({
    permissionCatalog: getPermissionCatalog(),
    roles: await getRoleSummaries()
  });
}

export async function createRole(req, res) {
  const roleKey = normalizeRoleKey(req.body?.key);
  const existedRole = await findAdminRoleByKey(roleKey);

  if (existedRole) {
    throw new HttpError(409, '角色标识已经存在');
  }

  const role = await createAdminRole({
    key: roleKey,
    name: normalizeName(req.body?.name),
    description: normalizeDescription(req.body?.description),
    isActive: normalizeIsActive(req.body?.isActive),
    sortOrder: normalizeSortOrder(req.body?.sortOrder)
  });
  invalidateRoleCache();
  await recordAuditLog(req, {
    action: auditActions.roleCreate,
    targetType: 'admin_role',
    targetId: role.key,
    targetLabel: role.name,
    detail: {
      after: roleSnapshot(role)
    }
  });

  res.status(201).json({
    role
  });
}

export async function updateRole(req, res) {
  const roleKey = normalizeRoleKey(req.params.roleKey);
  const role = await findRoleOrThrow(roleKey);
  const nextIsActive = role.isSystem ? true : normalizeIsActive(req.body?.isActive);

  await ensureRoleCanBeInactive(role, nextIsActive);

  const updatedRole = await updateAdminRole(roleKey, {
    name: normalizeName(req.body?.name),
    description: normalizeDescription(req.body?.description),
    isActive: nextIsActive,
    sortOrder: normalizeSortOrder(req.body?.sortOrder)
  });
  invalidateRoleCache();
  await recordAuditLog(req, {
    action: auditActions.roleUpdate,
    targetType: 'admin_role',
    targetId: updatedRole.key,
    targetLabel: updatedRole.name,
    detail: {
      before: roleSnapshot(role),
      after: roleSnapshot(updatedRole)
    }
  });

  res.status(200).json({
    role: updatedRole
  });
}

export async function updateRolePermissionList(req, res) {
  const roleKey = normalizeRoleKey(req.params.roleKey);
  const role = await findRoleOrThrow(roleKey);

  if (role.isSystem) {
    throw new HttpError(400, '系统角色默认拥有全部权限，不能在这里取消授权');
  }

  const permissionKeys = normalizePermissionKeys(req.body?.permissions);
  const updatedRole = await updateRolePermissions(roleKey, permissionKeys);
  invalidateRoleCache();
  await recordAuditLog(req, {
    action: auditActions.rolePermissionsUpdate,
    targetType: 'admin_role',
    targetId: updatedRole.key,
    targetLabel: updatedRole.name,
    detail: {
      before: {
        permissions: role.permissions
      },
      after: {
        permissions: updatedRole.permissions
      }
    }
  });

  res.status(200).json({
    role: updatedRole
  });
}

export async function removeRole(req, res) {
  const roleKey = normalizeRoleKey(req.params.roleKey);
  const role = await findRoleOrThrow(roleKey);

  if (role.isSystem) {
    throw new HttpError(400, '系统角色不能删除');
  }

  const userCount = await countAdminUsersByRole(role.key);

  if (userCount > 0) {
    throw new HttpError(400, '该角色下还有成员，不能删除');
  }

  await deleteAdminRole(role.key);
  invalidateRoleCache();
  await recordAuditLog(req, {
    action: auditActions.roleDelete,
    targetType: 'admin_role',
    targetId: role.key,
    targetLabel: role.name,
    detail: {
      before: roleSnapshot(role)
    }
  });

  res.status(200).json({
    deleted: true
  });
}

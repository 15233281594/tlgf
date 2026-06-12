// 提供数据库驱动的角色权限计算能力。
import { getPermissionCatalog, permissions } from '../auth/permissions.js';
import { findAdminRoleByKey, listAdminRoles } from './role.repository.js';

const roleCacheTtlMs = 30 * 1000;
const roleByKeyCache = new Map();
const roleSummariesCache = new Map();

function cloneRole(role) {
  return role
    ? {
        ...role,
        permissions: [...(role.permissions ?? [])],
        resolvedPermissions: role.resolvedPermissions ? [...role.resolvedPermissions] : undefined
      }
    : null;
}

function cloneRoles(roles) {
  return roles.map(cloneRole);
}

function readCache(cache, key) {
  const cached = cache.get(key);

  if (!cached || cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function writeCache(cache, key, value) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + roleCacheTtlMs
  });
}

async function getRoleByKeyCached(roleKey) {
  const cachedRole = readCache(roleByKeyCache, roleKey);

  if (cachedRole) {
    return cloneRole(cachedRole);
  }

  const role = await findAdminRoleByKey(roleKey);
  writeCache(roleByKeyCache, roleKey, cloneRole(role));

  return cloneRole(role);
}

export function invalidateRoleCache() {
  roleByKeyCache.clear();
  roleSummariesCache.clear();
}

function resolvePermissionKeys(permissionKeys) {
  if (permissionKeys.includes(permissions.all)) {
    return getPermissionCatalog().map((permission) => permission.key);
  }

  return permissionKeys;
}

export async function getPermissionsForRole(roleKey) {
  const role = await getRoleByKeyCached(roleKey);

  if (!role || !role.isActive) {
    return [];
  }

  return role.permissions;
}

export async function hasRolePermission(roleKey, permission) {
  const rolePermissions = await getPermissionsForRole(roleKey);

  return rolePermissions.includes(permissions.all) || rolePermissions.includes(permission);
}

export async function getRoleProfile(roleKey) {
  const role = await getRoleByKeyCached(roleKey);

  if (!role) {
    return {
      key: roleKey,
      name: roleKey,
      description: '未配置角色说明。',
      isSystem: false,
      isActive: false,
      sortOrder: 999
    };
  }

  return role;
}

export async function isKnownRole(roleKey) {
  const role = await getRoleByKeyCached(roleKey);

  return Boolean(role?.isActive);
}

export async function getRoleSummaries({ onlyActive = false } = {}) {
  const cacheKey = onlyActive ? 'active' : 'all';
  const cachedRoles = readCache(roleSummariesCache, cacheKey);

  if (cachedRoles) {
    return cloneRoles(cachedRoles);
  }

  const roles = await listAdminRoles({ onlyActive });

  const roleSummaries = roles.map((role) => {
    const resolvedPermissions = resolvePermissionKeys(role.permissions);

    return {
      ...role,
      resolvedPermissions,
      permissionCount: resolvedPermissions.length
    };
  });

  writeCache(roleSummariesCache, cacheKey, cloneRoles(roleSummaries));

  return cloneRoles(roleSummaries);
}

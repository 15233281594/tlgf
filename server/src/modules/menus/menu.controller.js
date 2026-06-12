// 提供后台菜单渲染和菜单管理接口。
import { HttpError } from '../../core/errors.js';
import { auditActions } from '../audit/audit.actions.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { getPermissionCatalog, isKnownPermission, permissions } from '../auth/permissions.js';
import { getPermissionsForRole } from '../roles/role.service.js';
import {
  countMenuChildren,
  createAdminMenu,
  deleteAdminMenu,
  findAdminMenuById,
  findAdminMenuByKey,
  listAdminMenus,
  updateAdminMenu
} from './menu.repository.js';

const menuKeyPattern = /^[a-z][a-z0-9-]{1,63}$/;
const menuTypes = new Set(['domain', 'menu']);

function toNullableString(value, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeMenuKey(menuKey) {
  if (typeof menuKey !== 'string' || !menuKeyPattern.test(menuKey.trim())) {
    throw new HttpError(400, '菜单标识只能使用小写字母、数字和中横线，并且需要以字母开头');
  }

  return menuKey.trim();
}

function normalizeTitle(title) {
  if (typeof title !== 'string') {
    throw new HttpError(400, '请输入菜单名称');
  }

  const normalized = title.trim();

  if (!normalized || normalized.length > 64) {
    throw new HttpError(400, '菜单名称长度需要在 1 到 64 个字符之间');
  }

  return normalized;
}

function normalizeMenuType(menuType) {
  if (typeof menuType !== 'string' || !menuTypes.has(menuType)) {
    throw new HttpError(400, '请选择有效菜单类型');
  }

  return menuType;
}

function normalizePermissionKey(permissionKey) {
  const normalized = toNullableString(permissionKey, 64);

  if (normalized && !isKnownPermission(normalized)) {
    throw new HttpError(400, '请选择有效权限点');
  }

  return normalized;
}

function normalizeSortOrder(sortOrder) {
  const normalized = Number(sortOrder);

  if (!Number.isInteger(normalized)) {
    return 0;
  }

  return normalized;
}

function normalizeBoolean(value, defaultValue) {
  if (typeof value !== 'boolean') {
    return defaultValue;
  }

  return value;
}

function readMenuId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '菜单 ID 不正确');
  }

  return id;
}

function menuSnapshot(menu) {
  return {
    id: menu.id,
    parentId: menu.parentId,
    menuKey: menu.menuKey,
    title: menu.title,
    menuType: menu.menuType,
    routeName: menu.routeName,
    permissionKey: menu.permissionKey,
    isVisible: menu.isVisible,
    isActive: menu.isActive
  };
}

function buildMenuTree(menus) {
  const menuMap = new Map();
  const roots = [];

  menus.forEach((menu) => {
    menuMap.set(menu.id, {
      ...menu,
      children: []
    });
  });

  menuMap.forEach((menu) => {
    if (menu.parentId && menuMap.has(menu.parentId)) {
      menuMap.get(menu.parentId).children.push(menu);
      return;
    }

    roots.push(menu);
  });

  return roots;
}

function canViewMenu(rolePermissions, menu) {
  return (
    !menu.permissionKey ||
    rolePermissions.includes(permissions.all) ||
    rolePermissions.includes(menu.permissionKey)
  );
}

async function filterNavigationTree(menus, role) {
  const rolePermissions = await getPermissionsForRole(role);
  const activeMenus = menus.filter((menu) => menu.isActive && menu.isVisible);
  const roots = buildMenuTree(activeMenus);

  return roots
    .filter((menu) => menu.menuType === 'domain')
    .map((domain) => ({
      ...domain,
      children: domain.children.filter((child) => child.menuType === 'menu' && canViewMenu(rolePermissions, child))
    }))
    .filter((domain) => domain.children.length > 0);
}

async function normalizeParentId(parentId, menuType, currentId = null) {
  if (menuType === 'domain') {
    return null;
  }

  const normalizedParentId = Number(parentId);

  if (!Number.isInteger(normalizedParentId) || normalizedParentId <= 0) {
    throw new HttpError(400, '请选择所属一级菜单');
  }

  if (currentId && Number(currentId) === normalizedParentId) {
    throw new HttpError(400, '上级菜单不能选择自己');
  }

  const parent = await findAdminMenuById(normalizedParentId);

  if (!parent || parent.menuType !== 'domain') {
    throw new HttpError(400, '上级菜单必须是一级菜单');
  }

  return normalizedParentId;
}

async function normalizeMenuPayload(body, currentId = null) {
  const menuType = normalizeMenuType(body?.menuType);
  const parentId = await normalizeParentId(body?.parentId, menuType, currentId);
  const menuKey = normalizeMenuKey(body?.menuKey);

  return {
    parentId,
    menuKey,
    title: normalizeTitle(body?.title),
    menuType,
    icon: toNullableString(body?.icon, 64),
    routeName: menuType === 'domain' ? null : toNullableString(body?.routeName, 64),
    permissionKey: normalizePermissionKey(body?.permissionKey),
    groupTitle: menuType === 'domain' ? null : toNullableString(body?.groupTitle, 64),
    badge: menuType === 'domain' ? null : toNullableString(body?.badge, 32),
    sortOrder: normalizeSortOrder(body?.sortOrder),
    isVisible: normalizeBoolean(body?.isVisible, true),
    isActive: normalizeBoolean(body?.isActive, true)
  };
}

export async function getAdminNavigation(req, res) {
  const menus = await listAdminMenus();

  res.status(200).json({
    menus: await filterNavigationTree(menus, req.admin.role)
  });
}

export async function listMenuManagement(req, res) {
  const menus = await listAdminMenus();

  res.status(200).json({
    menus,
    tree: buildMenuTree(menus),
    permissionCatalog: getPermissionCatalog()
  });
}

export async function createMenu(req, res) {
  const payload = await normalizeMenuPayload(req.body);
  const existedMenu = await findAdminMenuByKey(payload.menuKey);

  if (existedMenu) {
    throw new HttpError(409, '菜单标识已经存在');
  }

  const menu = await createAdminMenu(payload);
  await recordAuditLog(req, {
    action: auditActions.menuCreate,
    targetType: 'admin_menu',
    targetId: menu.id,
    targetLabel: menu.title,
    detail: {
      after: menuSnapshot(menu)
    }
  });

  res.status(201).json({
    menu
  });
}

export async function updateMenu(req, res) {
  const id = readMenuId(req);
  const menu = await findAdminMenuById(id);

  if (!menu) {
    throw new HttpError(404, '菜单不存在');
  }

  const payload = await normalizeMenuPayload(req.body, id);
  const existedMenu = await findAdminMenuByKey(payload.menuKey);

  if (existedMenu && Number(existedMenu.id) !== id) {
    throw new HttpError(409, '菜单标识已经存在');
  }

  const updatedMenu = await updateAdminMenu(id, payload);
  await recordAuditLog(req, {
    action: auditActions.menuUpdate,
    targetType: 'admin_menu',
    targetId: updatedMenu.id,
    targetLabel: updatedMenu.title,
    detail: {
      before: menuSnapshot(menu),
      after: menuSnapshot(updatedMenu)
    }
  });

  res.status(200).json({
    menu: updatedMenu
  });
}

export async function removeMenu(req, res) {
  const id = readMenuId(req);
  const menu = await findAdminMenuById(id);

  if (!menu) {
    throw new HttpError(404, '菜单不存在');
  }

  const childCount = await countMenuChildren(id);

  if (childCount > 0) {
    throw new HttpError(400, '请先删除子菜单');
  }

  await deleteAdminMenu(id);
  await recordAuditLog(req, {
    action: auditActions.menuDelete,
    targetType: 'admin_menu',
    targetId: menu.id,
    targetLabel: menu.title,
    detail: {
      before: menuSnapshot(menu)
    }
  });

  res.status(200).json({
    deleted: true
  });
}

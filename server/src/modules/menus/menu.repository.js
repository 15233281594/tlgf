// 封装后台菜单的数据查询和写入逻辑。
import { getModels } from '../../models/index.js';

const menuAttributes = [
  'id',
  'parentId',
  'menuKey',
  'title',
  'menuType',
  'icon',
  'routeName',
  'permissionKey',
  'groupTitle',
  'badge',
  'sortOrder',
  'isVisible',
  'isActive',
  'created_at',
  'updated_at'
];
const menuCacheTtlMs = 30 * 1000;
let menuListCache = null;

function cloneMenu(menu) {
  return {
    ...menu,
    children: menu.children ? menu.children.map(cloneMenu) : undefined
  };
}

function cloneMenus(menus) {
  return menus.map(cloneMenu);
}

function readMenuListCache() {
  if (!menuListCache || menuListCache.expiresAt <= Date.now()) {
    menuListCache = null;
    return null;
  }

  return cloneMenus(menuListCache.menus);
}

export function invalidateMenuCache() {
  menuListCache = null;
}

function toAdminMenu(menu) {
  if (!menu) {
    return null;
  }

  const data = menu.get({ plain: true });

  return {
    id: data.id,
    parentId: data.parentId,
    menuKey: data.menuKey,
    title: data.title,
    menuType: data.menuType,
    icon: data.icon,
    routeName: data.routeName,
    permissionKey: data.permissionKey,
    groupTitle: data.groupTitle,
    badge: data.badge,
    sortOrder: data.sortOrder,
    isVisible: data.isVisible,
    isActive: data.isActive,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function listAdminMenus() {
  const cachedMenus = readMenuListCache();

  if (cachedMenus) {
    return cachedMenus;
  }

  const { AdminMenu } = getModels();
  const menus = await AdminMenu.findAll({
    attributes: menuAttributes,
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });

  const result = menus.map(toAdminMenu);
  menuListCache = {
    menus: cloneMenus(result),
    expiresAt: Date.now() + menuCacheTtlMs
  };

  return cloneMenus(result);
}

export async function findAdminMenuById(id) {
  const { AdminMenu } = getModels();
  const menu = await AdminMenu.findByPk(id, {
    attributes: menuAttributes
  });

  return toAdminMenu(menu);
}

export async function findAdminMenuByKey(menuKey) {
  const { AdminMenu } = getModels();
  const menu = await AdminMenu.findOne({
    where: {
      menuKey
    },
    attributes: menuAttributes
  });

  return toAdminMenu(menu);
}

export async function countMenuChildren(parentId) {
  const { AdminMenu } = getModels();

  return AdminMenu.count({
    where: {
      parentId
    }
  });
}

export async function createAdminMenu(payload) {
  const { AdminMenu } = getModels();
  const menu = await AdminMenu.create(payload);

  invalidateMenuCache();

  return findAdminMenuById(menu.id);
}

export async function updateAdminMenu(id, payload) {
  const { AdminMenu } = getModels();

  await AdminMenu.update(payload, {
    where: {
      id
    }
  });

  invalidateMenuCache();

  return findAdminMenuById(id);
}

export async function deleteAdminMenu(id) {
  const { AdminMenu } = getModels();

  await AdminMenu.destroy({
    where: {
      id
    }
  });

  invalidateMenuCache();
}

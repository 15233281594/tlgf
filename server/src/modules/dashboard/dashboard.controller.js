// 提供后台业务工作台聚合数据接口。
import { getPermissionCatalog } from '../auth/permissions.js';
import { listAuditLogs } from '../audit/audit.repository.js';
import { listAdminMembers } from '../members/member.repository.js';
import { listAdminMenus } from '../menus/menu.repository.js';
import { getOrderDashboardStats, listRecentAdminOrders } from '../orders/order.repository.js';
import { getRoleSummaries } from '../roles/role.service.js';

function summarizeMembers(members) {
  return {
    total: members.length,
    active: members.filter((member) => member.isActive).length,
    inactive: members.filter((member) => !member.isActive).length
  };
}

function summarizeMenus(menus) {
  return {
    total: menus.length,
    visible: menus.filter((menu) => menu.isActive && menu.isVisible).length,
    domains: menus.filter((menu) => menu.menuType === 'domain').length,
    items: menus.filter((menu) => menu.menuType === 'menu').length
  };
}

function summarizeRoles(roles) {
  return {
    total: roles.length,
    active: roles.filter((role) => role.isActive).length,
    system: roles.filter((role) => role.isSystem).length
  };
}

export async function getAdminDashboard(_req, res) {
  const [orderStats, recentOrders, members, menus, roles, auditLogs] = await Promise.all([
    getOrderDashboardStats(),
    listRecentAdminOrders(6),
    listAdminMembers(),
    listAdminMenus(),
    getRoleSummaries(),
    listAuditLogs({ limit: 6, offset: 0 })
  ]);

  res.status(200).json({
    metrics: {
      orders: orderStats,
      members: summarizeMembers(members),
      menus: summarizeMenus(menus),
      roles: summarizeRoles(roles),
      permissionCount: getPermissionCatalog().length
    },
    recentOrders,
    auditLogs,
    roles: roles.map((role) => ({
      key: role.key,
      name: role.name,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissionCount: role.permissionCount
    })),
    todo: [
      {
        key: 'payment-review',
        title: '支付待审核',
        count: orderStats.reviewing,
        routeName: 'orders',
        permission: 'payment:review'
      },
      {
        key: 'pending-orders',
        title: '待付款订单',
        count: orderStats.pending,
        routeName: 'orders',
        permission: 'order:read'
      },
      {
        key: 'role-governance',
        title: '启用角色',
        count: summarizeRoles(roles).active,
        routeName: 'roles',
        permission: 'permission:manage'
      },
      {
        key: 'visible-menus',
        title: '可见菜单',
        count: summarizeMenus(menus).visible,
        routeName: 'menu-management',
        permission: 'menu:manage'
      }
    ]
  });
}

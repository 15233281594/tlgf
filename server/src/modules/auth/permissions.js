// 定义后台角色到权限点的映射，供登录返回和接口鉴权共同使用。
export const permissions = Object.freeze({
  all: '*',
  dashboardView: 'dashboard:view',
  orderRead: 'order:read',
  orderManage: 'order:manage',
  paymentReview: 'payment:review',
  clientRead: 'client:read',
  clientConfigure: 'client:configure',
  permissionManage: 'permission:manage',
  memberManage: 'member:manage',
  auditRead: 'audit:read',
  menuManage: 'menu:manage'
});

export const permissionCatalog = Object.freeze([
  {
    key: permissions.dashboardView,
    module: '运营中台',
    name: '查看业务工作台',
    description: '查看后台首页、经营指标和基础待办。'
  },
  {
    key: permissions.orderRead,
    module: '订单履约',
    name: '查看订单',
    description: '查看订单列表、订单详情和履约状态。'
  },
  {
    key: permissions.orderManage,
    module: '订单履约',
    name: '处理订单',
    description: '修改订单状态、分配处理人和记录履约进度。'
  },
  {
    key: permissions.paymentReview,
    module: '交易财务',
    name: '支付审核',
    description: '查看支付凭证、核对金额并处理收款审核。'
  },
  {
    key: permissions.clientRead,
    module: '客户端',
    name: '查看客户端配置',
    description: '查看客户端首页、模板和公开配置。'
  },
  {
    key: permissions.clientConfigure,
    module: '客户端',
    name: '编辑客户端配置',
    description: '编辑页面装修、模板主题和客户端展示策略。'
  },
  {
    key: permissions.permissionManage,
    module: '权限中心',
    name: '管理角色权限',
    description: '查看角色权限矩阵，后续可编辑角色权限。'
  },
  {
    key: permissions.memberManage,
    module: '权限中心',
    name: '管理成员账号',
    description: '查看后台成员，后续可创建、停用和调整角色。'
  },
  {
    key: permissions.auditRead,
    module: '权限中心',
    name: '查看审计日志',
    description: '查看后台关键操作记录，用于追踪账号和权限变更。'
  },
  {
    key: permissions.menuManage,
    module: '权限中心',
    name: '管理后台菜单',
    description: '新增、编辑、删除后台菜单，并给菜单绑定权限点。'
  }
]);

export function getPermissionCatalog() {
  return permissionCatalog.map((item) => ({ ...item }));
}

export function isKnownPermission(permission) {
  return permission === permissions.all || permissionCatalog.some((item) => item.key === permission);
}

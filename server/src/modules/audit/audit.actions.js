// 定义后台审计日志动作枚举和动作展示名称。
export const auditActions = Object.freeze({
  authLogin: 'auth.login',
  authLogout: 'auth.logout',
  authProfileUpdate: 'auth.profile.update',
  authPasswordChange: 'auth.password.change',
  memberCreate: 'member.create',
  memberUpdate: 'member.update',
  memberResetPassword: 'member.reset_password',
  memberEnable: 'member.enable',
  memberDisable: 'member.disable',
  menuCreate: 'menu.create',
  menuUpdate: 'menu.update',
  menuDelete: 'menu.delete',
  orderPaymentStatusUpdate: 'order.payment_status.update',
  orderNoteUpdate: 'order.note.update',
  roleCreate: 'role.create',
  roleUpdate: 'role.update',
  roleDelete: 'role.delete',
  rolePermissionsUpdate: 'role.permissions.update'
});

const auditActionLabels = Object.freeze({
  [auditActions.authLogin]: '后台登录',
  [auditActions.authLogout]: '退出登录',
  [auditActions.authProfileUpdate]: '修改个人资料',
  [auditActions.authPasswordChange]: '修改个人密码',
  [auditActions.memberCreate]: '新增成员',
  [auditActions.memberUpdate]: '编辑成员',
  [auditActions.memberResetPassword]: '重置成员密码',
  [auditActions.memberEnable]: '启用成员',
  [auditActions.memberDisable]: '停用成员',
  [auditActions.menuCreate]: '新增菜单',
  [auditActions.menuUpdate]: '编辑菜单',
  [auditActions.menuDelete]: '删除菜单',
  [auditActions.orderPaymentStatusUpdate]: '修改订单支付状态',
  [auditActions.orderNoteUpdate]: '修改订单备注',
  [auditActions.roleCreate]: '新增角色',
  [auditActions.roleUpdate]: '编辑角色',
  [auditActions.roleDelete]: '删除角色',
  [auditActions.rolePermissionsUpdate]: '修改角色授权'
});

export function getAuditActionLabel(action) {
  return auditActionLabels[action] ?? action;
}

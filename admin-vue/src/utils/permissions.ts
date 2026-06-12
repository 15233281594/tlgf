export const ALL_PERMISSION = '*'

export const permissionKeys = {
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
} as const

export type PermissionKey = (typeof permissionKeys)[keyof typeof permissionKeys] | typeof ALL_PERMISSION

export function hasPermission(permissions: string[] | undefined, permission: string) {
  return Boolean(permissions?.includes(ALL_PERMISSION) || permissions?.includes(permission))
}

import type { AuditLog } from './audit'
import type { AdminOrder } from './order'

export type DashboardMetrics = {
  orders: {
    total: number
    totalAmountCents: number
    pending: number
    reviewing: number
    paid: number
    rejected: number
    cancelled: number
  }
  members: {
    total: number
    active: number
    inactive: number
  }
  menus: {
    total: number
    visible: number
    domains: number
    items: number
  }
  roles: {
    total: number
    active: number
    system: number
  }
  permissionCount: number
}

export type DashboardRole = {
  key: string
  name: string
  isSystem: boolean
  isActive: boolean
  permissionCount: number
}

export type DashboardTodo = {
  key: string
  title: string
  count: number
  routeName: string
  permission: string
}

export type DashboardResponse = {
  metrics: DashboardMetrics
  recentOrders: AdminOrder[]
  auditLogs: AuditLog[]
  roles: DashboardRole[]
  todo: DashboardTodo[]
}

export type AuditLog = {
  id: number
  adminUserId: number | null
  adminEmail: string | null
  adminName: string | null
  action: string
  actionLabel: string
  targetType: string | null
  targetId: string | null
  targetLabel: string | null
  detail: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export type AuditLogListResponse = {
  logs: AuditLog[]
}

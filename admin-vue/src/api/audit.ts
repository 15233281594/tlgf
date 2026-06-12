import { apiClient, request } from '../utils/http'
import type { AuditLogListResponse } from '../types/audit'

export function getAdminAuditLogs(params: { limit?: number; offset?: number } = {}) {
  return request<AuditLogListResponse>(apiClient.get('/admin/audit-logs', { params }))
}

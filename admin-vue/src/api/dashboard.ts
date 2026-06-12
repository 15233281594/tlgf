import { apiClient, request } from '../utils/http'
import type { DashboardResponse } from '../types/dashboard'

export function getAdminDashboard() {
  return request<DashboardResponse>(apiClient.get('/admin/dashboard'))
}

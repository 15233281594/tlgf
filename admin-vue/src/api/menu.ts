import { apiClient, request } from '../utils/http'
import type {
  AdminMenuManagementResponse,
  AdminMenuMutationResponse,
  AdminMenuPayload,
  AdminNavigationResponse,
  DeleteMenuResponse
} from '../types/menu'

export function getAdminNavigation() {
  return request<AdminNavigationResponse>(apiClient.get('/admin/navigation'))
}

export function getAdminMenus() {
  return request<AdminMenuManagementResponse>(apiClient.get('/admin/menus'))
}

export function createAdminMenu(payload: AdminMenuPayload) {
  return request<AdminMenuMutationResponse>(apiClient.post('/admin/menus', payload))
}

export function updateAdminMenu(id: number, payload: AdminMenuPayload) {
  return request<AdminMenuMutationResponse>(apiClient.patch(`/admin/menus/${id}`, payload))
}

export function deleteAdminMenu(id: number) {
  return request<DeleteMenuResponse>(apiClient.delete(`/admin/menus/${id}`))
}

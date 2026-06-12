import { apiClient, request } from '../utils/http'
import type {
  CreateRolePayload,
  CreateMemberPayload,
  DeleteRoleResponse,
  MemberListResponse,
  MemberMutationResponse,
  ResetMemberPasswordPayload,
  RoleListResponse,
  RoleMutationResponse,
  UpdateMemberPayload,
  UpdateMemberStatusPayload,
  UpdateRolePayload,
  UpdateRolePermissionsPayload
} from '../types/permission'

export function getAdminRoles() {
  return request<RoleListResponse>(apiClient.get('/admin/roles'))
}

export function createAdminRole(payload: CreateRolePayload) {
  return request<RoleMutationResponse>(apiClient.post('/admin/roles', payload))
}

export function updateAdminRole(roleKey: string, payload: UpdateRolePayload) {
  return request<RoleMutationResponse>(apiClient.patch(`/admin/roles/${encodeURIComponent(roleKey)}`, payload))
}

export function updateAdminRolePermissions(roleKey: string, payload: UpdateRolePermissionsPayload) {
  return request<RoleMutationResponse>(apiClient.patch(`/admin/roles/${encodeURIComponent(roleKey)}/permissions`, payload))
}

export function deleteAdminRole(roleKey: string) {
  return request<DeleteRoleResponse>(apiClient.delete(`/admin/roles/${encodeURIComponent(roleKey)}`))
}

export function getAdminMembers() {
  return request<MemberListResponse>(apiClient.get('/admin/members'))
}

export function createAdminMember(payload: CreateMemberPayload) {
  return request<MemberMutationResponse>(apiClient.post('/admin/members', payload))
}

export function updateAdminMember(id: number, payload: UpdateMemberPayload) {
  return request<MemberMutationResponse>(apiClient.patch(`/admin/members/${id}`, payload))
}

export function resetAdminMemberPassword(id: number, payload: ResetMemberPasswordPayload) {
  return request<MemberMutationResponse>(apiClient.patch(`/admin/members/${id}/password`, payload))
}

export function updateAdminMemberStatus(id: number, payload: UpdateMemberStatusPayload) {
  return request<MemberMutationResponse>(apiClient.patch(`/admin/members/${id}/status`, payload))
}

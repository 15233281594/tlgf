export type PermissionCatalogItem = {
  key: string
  module: string
  name: string
  description: string
}

export type AdminRole = {
  key: string
  name: string
  description: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
  permissions: string[]
  resolvedPermissions: string[]
  permissionCount: number
}

export type AdminMember = {
  id: number
  email: string
  name: string
  role: string
  roleName: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string | null
  updatedAt: string | null
  permissions: string[]
}

export type RoleListResponse = {
  permissionCatalog: PermissionCatalogItem[]
  roles: AdminRole[]
}

export type RoleMutationResponse = {
  role: AdminRole
}

export type DeleteRoleResponse = {
  deleted: boolean
}

export type CreateRolePayload = {
  key: string
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

export type UpdateRolePayload = {
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

export type UpdateRolePermissionsPayload = {
  permissions: string[]
}

export type MemberListResponse = {
  members: AdminMember[]
  roles: AdminRole[]
}

export type MemberMutationResponse = {
  member: AdminMember
}

export type CreateMemberPayload = {
  name: string
  email: string
  password: string
  role: string
}

export type UpdateMemberPayload = {
  name: string
  role: string
}

export type ResetMemberPasswordPayload = {
  password: string
}

export type UpdateMemberStatusPayload = {
  isActive: boolean
}

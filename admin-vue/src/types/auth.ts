export type AdminUser = {
  id: number
  email: string
  name: string
  role: string
  permissions: string[]
}

export type AuthResponse = {
  authenticated: boolean
  user: AdminUser | null
}

export type LoginPayload = {
  email: string
  password: string
}

export type UpdateProfilePayload = {
  name: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export type AdminUser = {
  id: number
  email: string
  name: string
  role: string
}

export type AuthResponse = {
  authenticated: boolean
  user: AdminUser | null
}

export type LoginPayload = {
  email: string
  password: string
}

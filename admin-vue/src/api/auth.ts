import { apiClient, request } from "../utils/http";
import type { AuthResponse, ChangePasswordPayload, LoginPayload, UpdateProfilePayload } from "../types/auth";

export function getCurrentAdmin() {
  return request<AuthResponse>(apiClient.get("/auth/me"));
}

export function loginAdmin(payload: LoginPayload) {
  return request<AuthResponse>(apiClient.post("/auth/login", payload));
}

export function logoutAdmin() {
  return request<AuthResponse>(apiClient.post("/auth/logout"));
}

export function updateCurrentAdminProfile(payload: UpdateProfilePayload) {
  return request<AuthResponse>(apiClient.patch("/auth/profile", payload));
}

export function changeCurrentAdminPassword(payload: ChangePasswordPayload) {
  return request<AuthResponse>(apiClient.patch("/auth/password", payload));
}

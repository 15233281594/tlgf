import { apiClient, request } from "../utils/http";
import type { AuthResponse, LoginPayload } from "../types/auth";

export function getCurrentAdmin() {
  return request<AuthResponse>(apiClient.get("/auth/me"));
}

export function loginAdmin(payload: LoginPayload) {
  return request<AuthResponse>(apiClient.post("/auth/login", payload));
}

export function logoutAdmin() {
  return request<AuthResponse>(apiClient.post("/auth/logout"));
}

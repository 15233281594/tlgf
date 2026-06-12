import { computed, ref } from "vue";
import {
  changeCurrentAdminPassword,
  getCurrentAdmin,
  loginAdmin,
  logoutAdmin,
  updateCurrentAdminProfile,
} from "../api/auth";
import type { AdminUser, ChangePasswordPayload, LoginPayload, UpdateProfilePayload } from "../types/auth";

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const user = ref<AdminUser | null>(null);
const isLoggedIn = computed(() => Boolean(user.value));

let sessionChecked = false;
let sessionPromise: Promise<AdminUser | null> | null = null;

async function refreshSession() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const result = await getCurrentAdmin();
    user.value = result.authenticated ? result.user : null;
    sessionChecked = true;
    return user.value;
  } catch (error) {
    user.value = null;
    sessionChecked = true;
    return null;
  } finally {
    loading.value = false;
  }
}

async function ensureSession() {
  if (sessionChecked) {
    return user.value;
  }

  if (!sessionPromise) {
    sessionPromise = refreshSession().finally(() => {
      sessionPromise = null;
    });
  }

  return sessionPromise;
}

async function login(payload: LoginPayload) {
  submitting.value = true;
  errorMessage.value = "";

  try {
    const result = await loginAdmin(payload);
    user.value = result.user;
    sessionChecked = true;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "登录失败";
    throw error;
  } finally {
    submitting.value = false;
  }
}

async function logout() {
  await logoutAdmin();
  user.value = null;
  sessionChecked = true;
}

async function updateProfile(payload: UpdateProfilePayload) {
  const result = await updateCurrentAdminProfile(payload);
  user.value = result.user;
  sessionChecked = true;
  return result.user;
}

async function changePassword(payload: ChangePasswordPayload) {
  const result = await changeCurrentAdminPassword(payload);
  user.value = result.user;
  sessionChecked = true;
  return result.user;
}

export function useAuth() {
  return {
    changePassword,
    ensureSession,
    errorMessage,
    isLoggedIn,
    loading,
    login,
    logout,
    refreshSession,
    submitting,
    updateProfile,
    user,
  };
}

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import LoginPanel from '../components/LoginPanel.vue'
import { useAuth } from '../composables/useAuth'
import type { LoginPayload } from '../types/auth'

const route = useRoute()
const router = useRouter()
const { errorMessage, login, submitting } = useAuth()

async function handleLogin(payload: LoginPayload) {
  try {
    await login(payload)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    // The composable owns the visible error state.
  }
}
</script>

<template>
  <LoginPanel :error-message="errorMessage" :submitting="submitting" @login="handleLogin" />
</template>

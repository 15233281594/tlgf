import type { App, DirectiveBinding } from 'vue'
import { useAuth } from '../composables/useAuth'

function canAccess(requiredRoles: string | string[]) {
  const { user } = useAuth()

  if (!requiredRoles || !user.value) {
    return false
  }

  if (user.value.role === 'super_admin') {
    return true
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(user.value.role)
}

function applyPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  if (!binding.value || canAccess(binding.value)) {
    return
  }

  el.parentNode?.removeChild(el)
}

export function setupDirectives(app: App) {
  app.directive('permission', {
    mounted: applyPermission,
    updated: applyPermission
  })
}

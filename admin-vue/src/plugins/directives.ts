import type { App, DirectiveBinding } from 'vue'
import { useAuth } from '../composables/useAuth'
import { hasPermission } from '../utils/permissions'

function canAccess(requiredPermissions: string | string[]) {
  const { user } = useAuth()

  if (!requiredPermissions || !user.value) {
    return false
  }

  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
  return permissions.some((permission) => hasPermission(user.value?.permissions, permission))
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

import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { useAuth } from '../composables/useAuth'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true
      }
    },
    {
      path: '/',
      component: AdminLayout,
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView
        }
      ]
    }
  ]
})

router.beforeEach(async (to) => {
  const { ensureSession, isLoggedIn } = useAuth()

  await ensureSession()

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.guestOnly && isLoggedIn.value) {
    return {
      name: 'dashboard'
    }
  }
})

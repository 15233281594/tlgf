import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { useAuth } from '../composables/useAuth'
import { permissionKeys, hasPermission } from '../utils/permissions'
import AccountView from '../views/AccountView.vue'
import AuditLogsView from '../views/AuditLogsView.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import MembersView from '../views/MembersView.vue'
import MenuManagementView from '../views/MenuManagementView.vue'
import NoPermissionView from '../views/NoPermissionView.vue'
import OrdersView from '../views/OrdersView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import RolesView from '../views/RolesView.vue'

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
          component: DashboardView,
          meta: {
            permission: permissionKeys.dashboardView
          }
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrdersView,
          meta: {
            permission: permissionKeys.orderRead
          }
        },
        {
          path: 'payment',
          name: 'payment',
          component: PlaceholderView,
          meta: {
            title: '支付审核',
            description: '收款凭证、金额核对和审核记录会在这里接入。',
            permission: permissionKeys.paymentReview
          }
        },
        {
          path: 'site-builder',
          name: 'site-builder',
          component: PlaceholderView,
          meta: {
            title: '页面装修',
            description: '客户端首页、价格区和下单流程配置会在这里接入。',
            permission: permissionKeys.clientConfigure
          }
        },
        {
          path: 'theme',
          name: 'theme',
          component: PlaceholderView,
          meta: {
            title: '模板主题',
            description: '客户端主题、布局模板和品牌视觉配置会在这里接入。',
            permission: permissionKeys.clientConfigure
          }
        },
        {
          path: 'roles',
          name: 'roles',
          component: RolesView,
          meta: {
            permission: permissionKeys.permissionManage
          }
        },
        {
          path: 'members',
          name: 'members',
          component: MembersView,
          meta: {
            permission: permissionKeys.memberManage
          }
        },
        {
          path: 'menu-management',
          name: 'menu-management',
          component: MenuManagementView,
          meta: {
            permission: permissionKeys.menuManage
          }
        },
        {
          path: 'audit-logs',
          name: 'audit-logs',
          component: AuditLogsView,
          meta: {
            permission: permissionKeys.auditRead
          }
        },
        {
          path: 'account',
          name: 'account',
          component: AccountView
        },
        {
          path: '403',
          name: 'no-permission',
          component: NoPermissionView
        }
      ]
    }
  ]
})

router.beforeEach(async (to) => {
  const { ensureSession, isLoggedIn, user } = useAuth()

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

  const requiredPermission = typeof to.meta.permission === 'string' ? to.meta.permission : ''

  if (requiredPermission && !hasPermission(user.value?.permissions, requiredPermission)) {
    return {
      name: 'no-permission',
      query: {
        redirect: to.fullPath
      }
    }
  }
})

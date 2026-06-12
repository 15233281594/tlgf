<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Activity, ArrowRight, FileText, KeyRound, MenuSquare, RefreshCw, ScrollText, UsersRound } from '@lucide/vue'
import { getAdminDashboard } from '../api/dashboard'
import type { AdminOrder, PaymentStatus } from '../types/order'
import type { DashboardResponse } from '../types/dashboard'
import { hasPermission, permissionKeys } from '../utils/permissions'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user } = useAuth()
const loading = ref(false)
const errorMessage = ref('')
const dashboard = ref<DashboardResponse | null>(null)

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: '待支付',
  reviewing: '待审核',
  paid: '已支付',
  rejected: '已驳回',
  cancelled: '已取消'
}

const metrics = computed(() => {
  const data = dashboard.value

  return [
    {
      label: '订单总量',
      value: data?.metrics.orders.total ?? 0,
      desc: `待审核 ${data?.metrics.orders.reviewing ?? 0}，待支付 ${data?.metrics.orders.pending ?? 0}`,
      icon: FileText
    },
    {
      label: '确认金额',
      value: formatMoney(data?.metrics.orders.totalAmountCents ?? 0),
      desc: `已支付订单 ${data?.metrics.orders.paid ?? 0} 笔`,
      icon: Activity
    },
    {
      label: '后台成员',
      value: data?.metrics.members.active ?? 0,
      desc: `共 ${data?.metrics.members.total ?? 0} 人，停用 ${data?.metrics.members.inactive ?? 0} 人`,
      icon: UsersRound
    },
    {
      label: '权限体系',
      value: data?.metrics.permissionCount ?? 0,
      desc: `${data?.metrics.roles.active ?? 0} 个启用角色，${data?.metrics.menus.visible ?? 0} 个可见菜单`,
      icon: KeyRound
    }
  ]
})

const visibleTodo = computed(() =>
  (dashboard.value?.todo ?? []).filter((item) => hasPermission(user.value?.permissions, item.permission))
)

function formatMoney(cents: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(cents / 100)
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function orderTitle(order: AdminOrder) {
  return order.customerName || order.contactValue || order.orderNo
}

function openRoute(routeName: string) {
  void router.push({ name: routeName })
}

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    dashboard.value = await getAdminDashboard()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '业务工作台加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section class="page-title">
    <div>
      <p>Business Console</p>
      <h1>业务工作台</h1>
      <span>订单、支付、权限、成员和审计日志都会聚合在这里，先看待办，再进入对应模块处理。</span>
    </div>
    <button class="secondary-button" type="button" :disabled="loading" @click="loadDashboard">
      <RefreshCw :size="16" />
      刷新
    </button>
  </section>

  <section v-if="errorMessage" class="notice error">{{ errorMessage }}</section>

  <section class="metrics-row">
    <article v-for="item in metrics" :key="item.label" class="metric-card">
      <div>
        <span>{{ item.label }}</span>
        <component :is="item.icon" :size="19" />
      </div>
      <strong>{{ item.value }}</strong>
      <p>{{ item.desc }}</p>
    </article>
  </section>

  <section class="main-grid">
    <section class="panel todo-panel">
      <header class="panel-head">
        <div>
          <p>Todo Queue</p>
          <h2>业务待办</h2>
        </div>
        <Activity :size="21" />
      </header>

      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!visibleTodo.length" class="empty-state">暂无可处理待办</div>

      <div v-else class="todo-list">
        <button v-for="item in visibleTodo" :key="item.key" type="button" @click="openRoute(item.routeName)">
          <span>
            <strong>{{ item.title }}</strong>
            <em>{{ item.count > 0 ? '需要关注' : '当前正常' }}</em>
          </span>
          <i>{{ item.count }}</i>
          <ArrowRight :size="17" />
        </button>
      </div>
    </section>

    <section class="panel orders-panel">
      <header class="panel-head">
        <div>
          <p>Recent Orders</p>
          <h2>最近订单</h2>
        </div>
        <button v-permission="permissionKeys.orderRead" class="secondary-button" type="button" @click="openRoute('orders')">
          查看订单
        </button>
      </header>

      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!dashboard?.recentOrders.length" class="empty-state">暂无订单</div>

      <table v-else>
        <thead>
          <tr>
            <th>订单</th>
            <th>客户</th>
            <th>金额</th>
            <th>支付</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in dashboard.recentOrders" :key="order.id">
            <td>
              <strong>{{ order.orderNo }}</strong>
              <em>{{ order.serviceType }}</em>
            </td>
            <td>{{ orderTitle(order) }}</td>
            <td>{{ formatMoney(order.amountCents) }}</td>
            <td>
              <span class="status-chip" :class="order.paymentStatus">{{ paymentStatusLabels[order.paymentStatus] }}</span>
            </td>
            <td>{{ formatDate(order.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>

  <section class="secondary-grid">
    <section class="panel roles-panel">
      <header class="panel-head">
        <div>
          <p>Role Governance</p>
          <h2>角色权限</h2>
        </div>
        <button v-permission="permissionKeys.permissionManage" class="secondary-button" type="button" @click="openRoute('roles')">
          配置权限
        </button>
      </header>

      <div class="role-grid">
        <article v-for="role in dashboard?.roles ?? []" :key="role.key">
          <strong>{{ role.name }}</strong>
          <span>{{ role.permissionCount }} 个权限点</span>
          <em>{{ role.isSystem ? '系统角色' : role.isActive ? '启用' : '停用' }}</em>
        </article>
      </div>
    </section>

    <section class="panel system-panel">
      <header class="panel-head">
        <div>
          <p>System Modules</p>
          <h2>后台能力</h2>
        </div>
        <MenuSquare :size="21" />
      </header>

      <div class="module-grid">
        <button v-permission="permissionKeys.memberManage" type="button" @click="openRoute('members')">
          <UsersRound :size="19" />
          <span>成员账号</span>
          <em>{{ dashboard?.metrics.members.total ?? 0 }} 人</em>
        </button>
        <button v-permission="permissionKeys.menuManage" type="button" @click="openRoute('menu-management')">
          <MenuSquare :size="19" />
          <span>菜单管理</span>
          <em>{{ dashboard?.metrics.menus.visible ?? 0 }} 个可见</em>
        </button>
        <button v-permission="permissionKeys.auditRead" type="button" @click="openRoute('audit-logs')">
          <ScrollText :size="19" />
          <span>审计日志</span>
          <em>最近 {{ dashboard?.auditLogs.length ?? 0 }} 条</em>
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.page-title,
.metrics-row,
.main-grid,
.secondary-grid,
.notice {
  margin: 20px 28px 0;
}

.page-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(49, 212, 232, 0.1), transparent 34%),
    #fff;
}

.page-title p,
.panel-head p {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.page-title h1 {
  margin: 0;
  font-size: 30px;
}

.page-title span {
  display: block;
  max-width: 760px;
  margin-top: 10px;
  color: var(--muted);
  line-height: 1.7;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.panel,
.notice {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}

.metric-card {
  padding: 18px;
}

.metric-card div,
.panel-head,
.todo-list button,
.module-grid button,
.secondary-button {
  display: flex;
  align-items: center;
}

.metric-card div,
.panel-head {
  justify-content: space-between;
  gap: 14px;
}

.metric-card span,
.todo-list em,
.role-grid span,
.role-grid em,
.module-grid em {
  color: var(--muted);
  font-size: 13px;
}

.metric-card strong {
  display: block;
  margin-top: 12px;
  font-size: 30px;
  line-height: 1;
}

.metric-card p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.main-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 14px;
}

.secondary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 14px;
}

.panel {
  min-width: 0;
  padding: 20px;
}

.panel-head {
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 20px;
}

.secondary-button {
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: #344054;
  background: #fff;
  font-weight: 800;
}

.todo-list {
  display: grid;
  gap: 10px;
}

.todo-list button {
  width: 100%;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  color: var(--text);
  background: #f8fbff;
  text-align: left;
}

.todo-list button:hover {
  border-color: rgba(216, 168, 77, 0.46);
  background: #fff8e8;
}

.todo-list strong,
.todo-list em {
  display: block;
}

.todo-list em {
  margin-top: 5px;
}

.todo-list i {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 6px;
  color: #7a5616;
  background: rgba(216, 168, 77, 0.14);
  font-style: normal;
  font-weight: 900;
}

.orders-panel {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

th,
td {
  min-height: 54px;
  padding: 13px 12px;
  border-bottom: 1px solid #edf1f6;
  text-align: left;
  vertical-align: middle;
  font-size: 14px;
}

th {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

td strong,
td em {
  display: block;
}

td em {
  margin-top: 5px;
  color: #7e8ea3;
  font-size: 12px;
  font-style: normal;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-chip.pending {
  color: #7a5616;
  background: #fff4d7;
}

.status-chip.reviewing {
  color: #175cd3;
  background: #eaf1ff;
}

.status-chip.paid {
  color: #16665a;
  background: #e8f7f2;
}

.status-chip.rejected,
.status-chip.cancelled {
  color: var(--danger);
  background: #fff5f5;
}

.role-grid,
.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.role-grid article,
.module-grid button {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  background: #f8fbff;
}

.role-grid strong,
.role-grid span,
.role-grid em,
.module-grid span,
.module-grid em {
  display: block;
}

.role-grid span,
.role-grid em,
.module-grid em {
  margin-top: 6px;
}

.module-grid button {
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
  color: var(--text);
  text-align: left;
}

.module-grid button:hover {
  border-color: rgba(216, 168, 77, 0.46);
  background: #fff8e8;
}

.notice {
  padding: 12px 14px;
  font-weight: 800;
}

.notice.error {
  color: var(--danger);
  background: #fff5f5;
}

.empty-state {
  display: grid;
  min-height: 220px;
  place-items: center;
  color: var(--muted);
}

@media (max-width: 1280px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-grid,
  .secondary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 840px) {
  .page-title,
  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .page-title,
  .metrics-row,
  .main-grid,
  .secondary-grid,
  .notice {
    margin-right: 14px;
    margin-left: 14px;
  }

  .page-title,
  .panel {
    padding: 20px;
  }

  .metrics-row,
  .role-grid,
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>

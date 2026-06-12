<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CircleDollarSign, Eye, FileText, RefreshCw, Save, Search, X } from '@lucide/vue'
import {
  getAdminOrderDetail,
  getAdminOrders,
  updateAdminOrderNote,
  updateAdminOrderPaymentStatus
} from '../api/order'
import PaginationBar from '../components/PaginationBar.vue'
import { useAuth } from '../composables/useAuth'
import type { AdminOrder, PaymentStatus } from '../types/order'
import { hasPermission, permissionKeys } from '../utils/permissions'

const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'pending', label: '待支付' },
  { value: 'reviewing', label: '待审核' },
  { value: 'paid', label: '已支付' },
  { value: 'rejected', label: '已驳回' },
  { value: 'cancelled', label: '已取消' }
]

const contactTypeLabels: Record<AdminOrder['contactType'], string> = {
  wechat: '微信',
  qq: 'QQ',
  phone: '手机',
  other: '其他'
}

const { user } = useAuth()
const loading = ref(false)
const detailLoading = ref(false)
const savingPayment = ref(false)
const savingNote = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')
const keyword = ref('')
const paymentStatus = ref<PaymentStatus | 'all'>('all')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const orders = ref<AdminOrder[]>([])
const selectedOrder = ref<AdminOrder | null>(null)
const paymentDraft = ref<PaymentStatus>('pending')
const noteDraft = ref('')

const canReviewPayment = computed(() => hasPermission(user.value?.permissions, permissionKeys.paymentReview))
const canManageOrder = computed(() => hasPermission(user.value?.permissions, permissionKeys.orderManage))
const reviewingCount = computed(() => orders.value.filter((order) => order.paymentStatus === 'reviewing').length)
const paidCount = computed(() => orders.value.filter((order) => order.paymentStatus === 'paid').length)

function paymentStatusLabel(status: PaymentStatus) {
  return paymentStatusOptions.find((item) => item.value === status)?.label ?? status
}

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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function replaceOrder(order: AdminOrder) {
  const index = orders.value.findIndex((item) => item.id === order.id)

  if (index >= 0) {
    orders.value[index] = order
  }

  if (selectedOrder.value?.id === order.id) {
    selectedOrder.value = order
    paymentDraft.value = order.paymentStatus
    noteDraft.value = order.note ?? ''
  }
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getAdminOrders({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      paymentStatus: paymentStatus.value
    })
    orders.value = result.orders
    total.value = result.pagination.total
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单列表加载失败'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  actionMessage.value = ''

  if (page.value === 1) {
    void loadOrders()
    return
  }

  page.value = 1
}

function resetFilters() {
  keyword.value = ''
  paymentStatus.value = 'all'
  applyFilters()
}

async function openDetail(order: AdminOrder) {
  selectedOrder.value = order
  paymentDraft.value = order.paymentStatus
  noteDraft.value = order.note ?? ''
  detailLoading.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    const result = await getAdminOrderDetail(order.id)
    selectedOrder.value = result.order
    paymentDraft.value = result.order.paymentStatus
    noteDraft.value = result.order.note ?? ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单详情加载失败'
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  selectedOrder.value = null
  noteDraft.value = ''
}

async function savePaymentStatus() {
  if (!selectedOrder.value) {
    return
  }

  savingPayment.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    const result = await updateAdminOrderPaymentStatus(selectedOrder.value.id, {
      paymentStatus: paymentDraft.value
    })
    replaceOrder(result.order)
    actionMessage.value = '支付状态已保存'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '支付状态保存失败'
  } finally {
    savingPayment.value = false
  }
}

async function saveNote() {
  if (!selectedOrder.value) {
    return
  }

  savingNote.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    const result = await updateAdminOrderNote(selectedOrder.value.id, {
      note: noteDraft.value
    })
    replaceOrder(result.order)
    actionMessage.value = '履约备注已保存'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '履约备注保存失败'
  } finally {
    savingNote.value = false
  }
}

watch([page, pageSize], () => {
  void loadOrders()
})

onMounted(loadOrders)
</script>

<template>
  <section class="page-title">
    <div>
      <p>Order Fulfillment</p>
      <h1>订单履约</h1>
      <span>查看客户订单、支付状态和履约备注，后续客户端下单、支付审核和客服处理都会汇总到这里。</span>
    </div>
    <button class="secondary-button" type="button" :disabled="loading" @click="loadOrders">
      <RefreshCw :size="16" />
      刷新
    </button>
  </section>

  <section class="metrics-row">
    <article class="metric-card">
      <span>筛选结果</span>
      <strong>{{ total }}</strong>
      <p>当前条件下的订单总数。</p>
    </article>
    <article class="metric-card">
      <span>当前页</span>
      <strong>{{ orders.length }}</strong>
      <p>本页正在展示的订单数量。</p>
    </article>
    <article class="metric-card">
      <span>待审核</span>
      <strong>{{ reviewingCount }}</strong>
      <p>当前页等待财务核对的订单。</p>
    </article>
    <article class="metric-card">
      <span>已支付</span>
      <strong>{{ paidCount }}</strong>
      <p>当前页已经确认收款的订单。</p>
    </article>
  </section>

  <section class="filter-panel">
    <label class="search-box">
      <Search :size="17" />
      <input v-model.trim="keyword" type="search" placeholder="搜索订单号、客户、联系方式、服务类型" @keyup.enter="applyFilters" />
    </label>

    <label>
      <span>支付状态</span>
      <select v-model="paymentStatus" @change="applyFilters">
        <option value="all">全部状态</option>
        <option v-for="item in paymentStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </label>

    <div class="filter-actions">
      <button class="primary-action" type="button" @click="applyFilters">
        <Search :size="16" />
        查询
      </button>
      <button class="secondary-button" type="button" @click="resetFilters">重置</button>
    </div>
  </section>

  <section v-if="errorMessage" class="notice error">{{ errorMessage }}</section>
  <section v-if="actionMessage" class="notice success">{{ actionMessage }}</section>

  <section class="panel orders-panel">
    <header class="panel-head">
      <div>
        <p>Order List</p>
        <h2>订单列表</h2>
      </div>
      <FileText :size="21" />
    </header>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!orders.length" class="empty-state">暂无订单</div>

    <table v-else>
      <thead>
        <tr>
          <th>订单</th>
          <th>客户</th>
          <th>服务</th>
          <th>段位</th>
          <th>金额</th>
          <th>支付</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>
            <strong>{{ order.orderNo }}</strong>
            <em>#{{ order.id }}</em>
          </td>
          <td>
            <strong>{{ order.customerName || '-' }}</strong>
            <em>{{ contactTypeLabels[order.contactType] }}：{{ order.contactValue || '-' }}</em>
          </td>
          <td>{{ order.serviceType }}</td>
          <td>{{ order.currentRank || '-' }} → {{ order.targetRank || '-' }}</td>
          <td>{{ formatMoney(order.amountCents) }}</td>
          <td>
            <span class="status-chip" :class="order.paymentStatus">{{ paymentStatusLabel(order.paymentStatus) }}</span>
          </td>
          <td>{{ formatDate(order.createdAt) }}</td>
          <td>
            <button class="row-button" type="button" @click="openDetail(order)">
              <Eye :size="15" />
              详情
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <PaginationBar v-if="total" v-model:page="page" v-model:page-size="pageSize" :total="total" />
  </section>

  <Teleport to="body">
    <div v-if="selectedOrder" class="modal-backdrop" @click.self="closeDetail">
      <section class="modal-panel" role="dialog" aria-modal="true" :aria-label="`订单详情：${selectedOrder.orderNo}`">
        <header class="panel-head">
          <div>
            <p>Order Detail</p>
            <h2>{{ selectedOrder.orderNo }}</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" @click="closeDetail">
            <X :size="18" />
          </button>
        </header>

        <div v-if="detailLoading" class="empty-state compact">加载订单详情...</div>

        <template v-else>
          <div class="detail-grid">
            <div>
              <span>客户</span>
              <strong>{{ selectedOrder.customerName || '-' }}</strong>
              <p>{{ contactTypeLabels[selectedOrder.contactType] }}：{{ selectedOrder.contactValue || '-' }}</p>
            </div>
            <div>
              <span>服务类型</span>
              <strong>{{ selectedOrder.serviceType }}</strong>
              <p>{{ selectedOrder.currentRank || '-' }} → {{ selectedOrder.targetRank || '-' }}</p>
            </div>
            <div>
              <span>订单金额</span>
              <strong>{{ formatMoney(selectedOrder.amountCents) }}</strong>
              <p>创建：{{ formatDate(selectedOrder.createdAt) }}</p>
            </div>
            <div>
              <span>支付凭证</span>
              <strong>{{ selectedOrder.paymentScreenshotKey ? '已上传' : '未上传' }}</strong>
              <p>{{ selectedOrder.paymentScreenshotKey || '-' }}</p>
            </div>
          </div>

          <section class="detail-section">
            <header>
              <div>
                <p>Payment Review</p>
                <h3>支付审核</h3>
              </div>
              <CircleDollarSign :size="20" />
            </header>
            <div class="inline-form">
              <label>
                <span>支付状态</span>
                <select v-model="paymentDraft" :disabled="!canReviewPayment">
                  <option v-for="item in paymentStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
              </label>
              <button class="primary-action" type="button" :disabled="!canReviewPayment || savingPayment" @click="savePaymentStatus">
                <Save :size="16" />
                {{ savingPayment ? '保存中' : '保存支付状态' }}
              </button>
            </div>
          </section>

          <section class="detail-section">
            <header>
              <div>
                <p>Fulfillment Note</p>
                <h3>履约备注</h3>
              </div>
            </header>
            <textarea v-model.trim="noteDraft" :disabled="!canManageOrder" rows="6" placeholder="记录客户沟通、履约进度、异常情况" />
            <footer class="form-actions">
              <button class="primary-action" type="button" :disabled="!canManageOrder || savingNote" @click="saveNote">
                <Save :size="16" />
                {{ savingNote ? '保存中' : '保存备注' }}
              </button>
            </footer>
          </section>
        </template>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.page-title,
.metrics-row,
.filter-panel,
.orders-panel,
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
.panel-head p,
.detail-section header p {
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
.filter-panel,
.panel,
.modal-panel,
.notice {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}

.metric-card {
  padding: 18px;
}

.metric-card span,
.filter-panel label span,
.detail-grid span,
.inline-form label span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
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

.filter-panel {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 220px auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: none;
}

.filter-panel label:not(.search-box),
.inline-form label {
  display: grid;
  gap: 8px;
}

.filter-panel select,
.inline-form select,
.detail-section textarea {
  width: 100%;
  min-height: 42px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: #fff;
  outline: none;
}

.detail-section textarea {
  padding: 11px;
  resize: vertical;
}

.filter-actions,
.form-actions,
.inline-form,
.panel-head,
.primary-action,
.secondary-button,
.row-button,
.icon-button {
  display: flex;
  align-items: center;
}

.filter-actions {
  gap: 10px;
}

.primary-action,
.secondary-button,
.row-button,
.icon-button {
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  border-radius: 6px;
  font-weight: 800;
}

.primary-action {
  padding: 0 14px;
  border: 1px solid rgba(255, 215, 122, 0.42);
  color: #08101c;
  background: linear-gradient(135deg, #ffd77a, #c89236);
}

.secondary-button,
.row-button,
.icon-button {
  padding: 0 12px;
  border: 1px solid var(--line);
  color: #344054;
  background: #fff;
}

.icon-button {
  width: 36px;
  padding: 0;
}

.panel,
.modal-panel {
  min-width: 0;
  padding: 20px;
}

.panel-head {
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.panel-head h2,
.detail-section h3 {
  margin: 0;
  font-size: 20px;
}

.orders-panel {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
}

th,
td {
  min-height: 58px;
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

.notice {
  padding: 12px 14px;
  font-weight: 800;
}

.notice.error {
  color: var(--danger);
  background: #fff5f5;
}

.notice.success {
  color: #16665a;
  background: #e8f7f2;
}

.empty-state {
  display: grid;
  gap: 8px;
  min-height: 260px;
  place-items: center;
  color: var(--muted);
}

.empty-state.compact {
  min-height: 180px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(5, 8, 16, 0.58);
  backdrop-filter: blur(8px);
}

.modal-panel {
  width: min(920px, 100%);
  max-height: min(860px, calc(100vh - 48px));
  overflow-y: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-grid > div {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  background: #f8fbff;
}

.detail-grid strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
}

.detail-grid p {
  overflow: hidden;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-section {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.detail-section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.inline-form {
  gap: 12px;
}

.inline-form label {
  flex: 1;
}

.form-actions {
  justify-content: flex-end;
}

@media (max-width: 1120px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-panel {
    grid-template-columns: 1fr 220px;
  }

  .filter-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 840px) {
  .page-title,
  .panel-head,
  .inline-form {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-panel,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-title,
  .metrics-row,
  .filter-panel,
  .orders-panel,
  .notice {
    margin-right: 14px;
    margin-left: 14px;
  }

  .page-title,
  .panel,
  .modal-panel {
    padding: 20px;
  }

  .metrics-row {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    align-items: end;
    padding: 14px;
  }
}
</style>

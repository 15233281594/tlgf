<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw, ScrollText } from '@lucide/vue'
import { getAdminAuditLogs } from '../api/audit'
import PaginationBar from '../components/PaginationBar.vue'
import { usePagination } from '../composables/usePagination'
import type { AuditLog } from '../types/audit'

const loading = ref(false)
const errorMessage = ref('')
const logs = ref<AuditLog[]>([])
const {
  page: auditPage,
  pageSize: auditPageSize,
  total: auditTotal,
  pagedItems: pagedLogs
} = usePagination(logs)
const latestLog = computed(() => logs.value[0])

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value))
}

function formatDetail(detail: unknown) {
  if (!detail) {
    return '-'
  }

  return JSON.stringify(detail)
}

async function loadAuditLogs() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getAdminAuditLogs({
      limit: 80
    })
    logs.value = result.logs
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '审计日志加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadAuditLogs)
</script>

<template>
  <section class="page-title">
    <div>
      <p>Audit Logs</p>
      <h1>审计日志</h1>
      <span>后台关键操作会记录操作人、动作、对象、IP 和时间。</span>
    </div>
    <button class="secondary-button" type="button" :disabled="loading" @click="loadAuditLogs">
      <RefreshCw :size="16" />
      刷新
    </button>
  </section>

  <section class="metrics-row">
    <article class="metric-card">
      <span>日志数量</span>
      <strong>{{ logs.length }}</strong>
      <p>当前页面展示最近 {{ logs.length }} 条。</p>
    </article>
    <article class="metric-card">
      <span>最近动作</span>
      <strong>{{ latestLog?.actionLabel || '-' }}</strong>
      <p>{{ latestLog ? formatDate(latestLog.createdAt) : '暂无记录' }}</p>
    </article>
  </section>

  <section v-if="errorMessage" class="notice error">{{ errorMessage }}</section>

  <section class="panel audit-panel">
    <header class="panel-head">
      <div>
        <p>Operation Trace</p>
        <h2>操作记录</h2>
      </div>
      <ScrollText :size="21" />
    </header>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!logs.length" class="empty-state">暂无审计日志</div>

    <table v-else>
      <thead>
        <tr>
          <th>时间</th>
          <th>动作</th>
          <th>操作人</th>
          <th>对象</th>
          <th>IP</th>
          <th>详情</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in pagedLogs" :key="log.id">
          <td>{{ formatDate(log.createdAt) }}</td>
          <td>
            <strong>{{ log.actionLabel }}</strong>
            <em>{{ log.action }}</em>
          </td>
          <td>
            <strong>{{ log.adminName || '-' }}</strong>
            <em>{{ log.adminEmail || '-' }}</em>
          </td>
          <td>
            <strong>{{ log.targetLabel || '-' }}</strong>
            <em>{{ log.targetType || '-' }}{{ log.targetId ? ` #${log.targetId}` : '' }}</em>
          </td>
          <td>{{ log.ipAddress || '-' }}</td>
          <td>
            <span class="detail-text">{{ formatDetail(log.detail) }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <PaginationBar
      v-if="auditTotal"
      v-model:page="auditPage"
      v-model:page-size="auditPageSize"
      :total="auditTotal"
    />
  </section>
</template>

<style scoped>
.page-title,
.metrics-row,
.audit-panel,
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
    linear-gradient(135deg, rgba(255, 215, 122, 0.12), transparent 32%),
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

.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: #344054;
  background: #fff;
  font-weight: 800;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.metric-card span {
  color: var(--muted);
  font-size: 13px;
}

.metric-card strong {
  display: block;
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.1;
}

.metric-card p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.panel {
  min-width: 0;
  padding: 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 20px;
}

.audit-panel {
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

td em {
  display: block;
  margin-top: 5px;
  color: #7e8ea3;
  font-size: 12px;
  font-style: normal;
}

.detail-text {
  display: block;
  max-width: 360px;
  overflow: hidden;
  color: #475467;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice {
  padding: 12px 14px;
  color: var(--danger);
  background: #fff5f5;
  font-weight: 800;
}

.empty-state {
  display: grid;
  min-height: 260px;
  place-items: center;
  color: var(--muted);
}

@media (max-width: 840px) {
  .page-title {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .page-title,
  .metrics-row,
  .audit-panel,
  .notice {
    margin-right: 14px;
    margin-left: 14px;
  }

  .page-title,
  .panel {
    padding: 20px;
  }

  .metrics-row {
    grid-template-columns: 1fr;
  }
}
</style>

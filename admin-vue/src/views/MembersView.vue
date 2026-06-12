<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Ban,
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  UserRoundCheck,
  UsersRound,
  X
} from '@lucide/vue'
import PaginationBar from '../components/PaginationBar.vue'
import {
  createAdminMember,
  getAdminMembers,
  resetAdminMemberPassword,
  updateAdminMember,
  updateAdminMemberStatus
} from '../api/permission'
import { usePagination } from '../composables/usePagination'
import type { AdminMember, AdminRole } from '../types/permission'

type EditorMode = 'create' | 'edit' | 'password'

const loading = ref(false)
const saving = ref(false)
const savingMemberId = ref<number | null>(null)
const errorMessage = ref('')
const actionMessage = ref('')
const editorMode = ref<EditorMode | null>(null)
const selectedMember = ref<AdminMember | null>(null)
const members = ref<AdminMember[]>([])
const roles = ref<AdminRole[]>([])
const {
  page: memberPage,
  pageSize: memberPageSize,
  total: memberTotal,
  pagedItems: pagedMembers
} = usePagination(members)
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'admin'
})

const activeMembers = computed(() => members.value.filter((member) => member.isActive))
const inactiveMembers = computed(() => members.value.filter((member) => !member.isActive))
const roleCount = computed(() => new Set(members.value.map((member) => member.role)).size)
const editorTitle = computed(() => {
  if (editorMode.value === 'create') {
    return '新增成员'
  }

  if (editorMode.value === 'password') {
    return `重置密码：${selectedMember.value?.name ?? ''}`
  }

  return `编辑成员：${selectedMember.value?.name ?? ''}`
})

function formatDate(value: string | null) {
  if (!value) {
    return '未登录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function resetForm() {
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = roles.value.find((role) => role.key === 'admin')?.key ?? roles.value[0]?.key ?? 'admin'
}

function replaceMember(member: AdminMember) {
  const index = members.value.findIndex((item) => item.id === member.id)

  if (index >= 0) {
    members.value[index] = member
    return
  }

  members.value = [member, ...members.value]
}

function openCreateEditor() {
  selectedMember.value = null
  resetForm()
  editorMode.value = 'create'
  actionMessage.value = ''
  errorMessage.value = ''
}

function openEditEditor(member: AdminMember) {
  selectedMember.value = member
  form.name = member.name
  form.email = member.email
  form.password = ''
  form.role = member.role
  editorMode.value = 'edit'
  actionMessage.value = ''
  errorMessage.value = ''
}

function openPasswordEditor(member: AdminMember) {
  selectedMember.value = member
  form.name = member.name
  form.email = member.email
  form.password = ''
  form.role = member.role
  editorMode.value = 'password'
  actionMessage.value = ''
  errorMessage.value = ''
}

function closeEditor() {
  editorMode.value = null
  selectedMember.value = null
  resetForm()
}

async function loadMembers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getAdminMembers()
    members.value = result.members
    roles.value = result.roles
    resetForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '成员列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitEditor() {
  if (!editorMode.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    if (editorMode.value === 'create') {
      const result = await createAdminMember({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      })
      replaceMember(result.member)
      actionMessage.value = '成员已创建'
      closeEditor()
      return
    }

    if (!selectedMember.value) {
      throw new Error('请选择成员')
    }

    if (editorMode.value === 'edit') {
      const result = await updateAdminMember(selectedMember.value.id, {
        name: form.name,
        role: form.role
      })
      replaceMember(result.member)
      actionMessage.value = '成员信息已保存'
      closeEditor()
      return
    }

    const result = await resetAdminMemberPassword(selectedMember.value.id, {
      password: form.password
    })
    replaceMember(result.member)
    actionMessage.value = '成员密码已重置'
    closeEditor()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function toggleMemberStatus(member: AdminMember) {
  const nextStatus = !member.isActive
  const confirmed = window.confirm(`确认${nextStatus ? '启用' : '停用'}成员「${member.name}」吗？`)

  if (!confirmed) {
    return
  }

  savingMemberId.value = member.id
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    const result = await updateAdminMemberStatus(member.id, {
      isActive: nextStatus
    })
    replaceMember(result.member)
    actionMessage.value = nextStatus ? '成员已启用' : '成员已停用'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '状态更新失败'
  } finally {
    savingMemberId.value = null
  }
}

onMounted(loadMembers)
</script>

<template>
  <section class="page-title">
    <div>
      <p>Admin Members</p>
      <h1>成员账号</h1>
      <span>后台成员从数据库读取，角色权限由后端统一计算，新增、停用、改角色和重置密码都在这里完成。</span>
    </div>
    <div class="title-actions">
      <button class="primary-action" type="button" @click="openCreateEditor">
        <Plus :size="16" />
        新增成员
      </button>
      <button class="secondary-button" type="button" :disabled="loading" @click="loadMembers">
        <RefreshCw :size="16" />
        刷新
      </button>
    </div>
  </section>

  <section class="metrics-row">
    <article class="metric-card">
      <span>全部成员</span>
      <strong>{{ members.length }}</strong>
      <p>当前后台账号数量。</p>
    </article>
    <article class="metric-card">
      <span>启用成员</span>
      <strong>{{ activeMembers.length }}</strong>
      <p>允许登录后台的账号。</p>
    </article>
    <article class="metric-card">
      <span>停用成员</span>
      <strong>{{ inactiveMembers.length }}</strong>
      <p>已禁用登录权限的账号。</p>
    </article>
    <article class="metric-card">
      <span>角色类型</span>
      <strong>{{ roleCount }}</strong>
      <p>成员当前分布的角色数量。</p>
    </article>
  </section>

  <section v-if="errorMessage" class="notice error">{{ errorMessage }}</section>
  <section v-if="actionMessage" class="notice success">{{ actionMessage }}</section>

  <Teleport to="body">
    <div v-if="editorMode" class="modal-backdrop" @click.self="closeEditor">
      <section class="modal-panel" role="dialog" aria-modal="true" :aria-label="editorTitle">
        <header class="panel-head">
          <div>
            <p>Member Form</p>
            <h2>{{ editorTitle }}</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" @click="closeEditor">
            <X :size="18" />
          </button>
        </header>

        <form class="member-form" @submit.prevent="submitEditor">
          <div class="form-grid">
            <label v-if="editorMode !== 'password'">
              <span>姓名</span>
              <input v-model.trim="form.name" type="text" maxlength="64" required />
            </label>

            <label v-if="editorMode === 'create'">
              <span>邮箱</span>
              <input v-model.trim="form.email" type="email" maxlength="128" required />
            </label>

            <label v-if="editorMode !== 'password'">
              <span>角色</span>
              <select v-model="form.role" required>
                <option v-for="role in roles" :key="role.key" :value="role.key">{{ role.name }}</option>
              </select>
            </label>

            <label v-if="editorMode === 'create' || editorMode === 'password'">
              <span>{{ editorMode === 'create' ? '初始密码' : '新密码' }}</span>
              <input v-model="form.password" type="password" minlength="8" maxlength="72" required />
            </label>
          </div>

          <footer class="form-actions">
            <button class="secondary-button" type="button" @click="closeEditor">
              <X :size="16" />
              取消
            </button>
            <button class="primary-action" type="submit" :disabled="saving">
              <Save :size="16" />
              保存
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>

  <section class="panel members-panel">
    <header class="panel-head">
      <div>
        <p>Member List</p>
        <h2>后台账号</h2>
      </div>
      <UsersRound :size="21" />
    </header>

    <div v-if="loading" class="empty-state">加载中...</div>

    <div v-else-if="!members.length" class="empty-state">
      <UserRoundCheck :size="28" />
      暂无成员
    </div>

    <table v-else>
      <thead>
        <tr>
          <th>成员</th>
          <th>角色</th>
          <th>权限数</th>
          <th>状态</th>
          <th>最近登录</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in pagedMembers" :key="member.id">
          <td>
            <div class="member-cell">
              <span>{{ member.name.slice(0, 1) }}</span>
              <div>
                <strong>{{ member.name }}</strong>
                <em>{{ member.email }}</em>
              </div>
            </div>
          </td>
          <td>
            <strong>{{ member.roleName }}</strong>
            <em>{{ member.role }}</em>
          </td>
          <td>{{ member.permissions.includes('*') ? '全部' : member.permissions.length }}</td>
          <td>
            <span class="status-chip" :class="{ strong: member.isActive }">
              {{ member.isActive ? '启用' : '停用' }}
            </span>
          </td>
          <td>{{ formatDate(member.lastLoginAt) }}</td>
          <td>
            <div class="row-actions">
              <button type="button" @click="openEditEditor(member)">
                <Pencil :size="15" />
                编辑
              </button>
              <button type="button" @click="openPasswordEditor(member)">
                <KeyRound :size="15" />
                密码
              </button>
              <button
                type="button"
                :class="{ danger: member.isActive }"
                :disabled="savingMemberId === member.id"
                @click="toggleMemberStatus(member)"
              >
                <Ban v-if="member.isActive" :size="15" />
                <CheckCircle2 v-else :size="15" />
                {{ member.isActive ? '停用' : '启用' }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <PaginationBar
      v-if="memberTotal"
      v-model:page="memberPage"
      v-model:page-size="memberPageSize"
      :total="memberTotal"
    />
  </section>
</template>

<style scoped>
.page-title,
.metrics-row,
.members-panel,
.notice {
  margin: 20px 28px 0;
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
  width: min(720px, 100%);
  max-height: min(760px, calc(100vh - 48px));
  overflow-y: auto;
  padding: 20px;
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

.title-actions,
.form-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-action,
.secondary-button,
.row-actions button,
.icon-button {
  display: inline-flex;
  align-items: center;
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
.row-actions button,
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

.row-actions button.danger {
  border-color: #f1c4c4;
  color: var(--danger);
  background: #fff5f5;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
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

.metric-card span {
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

.panel,
.modal-panel {
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

.member-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.member-form label {
  display: grid;
  gap: 8px;
}

.member-form label span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.member-form input,
.member-form select {
  width: 100%;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: #fff;
  outline: none;
}

.member-form input:focus,
.member-form select:focus {
  border-color: rgba(216, 168, 77, 0.7);
  box-shadow: 0 0 0 3px rgba(216, 168, 77, 0.14);
}

.form-actions {
  justify-content: flex-end;
}

.members-panel {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1040px;
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

.member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-cell > span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #06101b;
  background: var(--gold-2);
  font-weight: 900;
}

.member-cell strong {
  display: block;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  color: #667085;
  background: #f1f4f8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-chip.strong {
  color: #16665a;
  background: #e8f7f2;
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

@media (max-width: 1180px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 840px) {
  .page-title {
    align-items: stretch;
    flex-direction: column;
  }

  .title-actions,
  .form-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .page-title,
  .metrics-row,
  .members-panel,
  .notice {
    margin-right: 14px;
    margin-left: 14px;
  }

  .page-title,
  .panel,
  .modal-panel {
    padding: 20px;
  }

  .metrics-row,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    align-items: end;
    padding: 14px;
  }

  .modal-panel {
    max-height: calc(100vh - 28px);
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CheckCircle2, KeyRound, Pencil, Plus, RefreshCw, Save, ShieldCheck, Trash2, X } from '@lucide/vue'
import PaginationBar from '../components/PaginationBar.vue'
import {
  createAdminRole,
  deleteAdminRole,
  getAdminRoles,
  updateAdminRole,
  updateAdminRolePermissions
} from '../api/permission'
import { usePagination } from '../composables/usePagination'
import type { AdminRole, PermissionCatalogItem } from '../types/permission'

type EditorMode = 'create' | 'edit'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')
const roles = ref<AdminRole[]>([])
const permissionCatalog = ref<PermissionCatalogItem[]>([])
const activeRoleKey = ref('')
const draftPermissions = ref<string[]>([])
const editorMode = ref<EditorMode | null>(null)
const {
  page: permissionPage,
  pageSize: permissionPageSize,
  total: permissionTotal,
  pagedItems: pagedPermissions
} = usePagination(permissionCatalog)
const form = reactive({
  key: '',
  name: '',
  description: '',
  isActive: true,
  sortOrder: 50
})

const activeRole = computed(() => roles.value.find((role) => role.key === activeRoleKey.value) ?? roles.value[0])
const editableRole = computed(() => activeRole.value && !activeRole.value.isSystem)
const totalPermissions = computed(() => permissionCatalog.value.length)
const groupedPermissions = computed(() => {
  const groups = new Map<string, PermissionCatalogItem[]>()

  pagedPermissions.value.forEach((item) => {
    const list = groups.get(item.module) ?? []
    list.push(item)
    groups.set(item.module, list)
  })

  return Array.from(groups.entries()).map(([module, items]) => ({
    module,
    items
  }))
})
const moduleCount = computed(() => groupedPermissions.value.length)
const activePermissionCount = computed(() =>
  activeRole.value?.isSystem ? totalPermissions.value : draftPermissions.value.length
)
const editorTitle = computed(() => (editorMode.value === 'create' ? '新增角色' : `编辑角色：${activeRole.value?.name}`))

function setDraftPermissions(role: AdminRole | undefined) {
  draftPermissions.value = role?.isSystem ? permissionCatalog.value.map((item) => item.key) : [...(role?.permissions ?? [])]
}

function selectRole(role: AdminRole) {
  activeRoleKey.value = role.key
  setDraftPermissions(role)
  errorMessage.value = ''
  actionMessage.value = ''
}

function hasRolePermission(role: AdminRole, permission: PermissionCatalogItem) {
  if (role.isSystem) {
    return true
  }

  return draftPermissions.value.includes(permission.key)
}

function togglePermission(permissionKey: string) {
  if (!editableRole.value) {
    return
  }

  if (draftPermissions.value.includes(permissionKey)) {
    draftPermissions.value = draftPermissions.value.filter((item) => item !== permissionKey)
    return
  }

  draftPermissions.value = [...draftPermissions.value, permissionKey]
}

function resetForm() {
  form.key = ''
  form.name = ''
  form.description = ''
  form.isActive = true
  form.sortOrder = 50
}

function openCreateEditor() {
  resetForm()
  editorMode.value = 'create'
  errorMessage.value = ''
  actionMessage.value = ''
}

function openEditEditor() {
  if (!activeRole.value) {
    return
  }

  form.key = activeRole.value.key
  form.name = activeRole.value.name
  form.description = activeRole.value.description
  form.isActive = activeRole.value.isActive
  form.sortOrder = activeRole.value.sortOrder
  editorMode.value = 'edit'
  errorMessage.value = ''
  actionMessage.value = ''
}

function closeEditor() {
  editorMode.value = null
  resetForm()
}

function replaceRole(role: AdminRole) {
  const index = roles.value.findIndex((item) => item.key === role.key)

  if (index >= 0) {
    roles.value[index] = role
    return
  }

  roles.value = [...roles.value, role].sort((current, next) => current.sortOrder - next.sortOrder)
}

async function loadRoles() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getAdminRoles()
    roles.value = result.roles
    permissionCatalog.value = result.permissionCatalog

    const selectedRole = roles.value.find((role) => role.key === activeRoleKey.value) ?? roles.value[0]
    if (selectedRole) {
      selectRole(selectedRole)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '角色权限加载失败'
  } finally {
    loading.value = false
  }
}

async function submitRole() {
  saving.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    if (editorMode.value === 'create') {
      const result = await createAdminRole({
        key: form.key,
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder)
      })
      activeRoleKey.value = result.role.key
      actionMessage.value = '角色已创建'
    } else if (activeRole.value) {
      await updateAdminRole(activeRole.value.key, {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder)
      })
      actionMessage.value = '角色信息已保存'
    }

    closeEditor()
    await loadRoles()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function savePermissions() {
  if (!activeRole.value || activeRole.value.isSystem) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    const result = await updateAdminRolePermissions(activeRole.value.key, {
      permissions: draftPermissions.value
    })
    replaceRole(result.role)
    selectRole(result.role)
    actionMessage.value = '角色授权已保存'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '授权保存失败'
  } finally {
    saving.value = false
  }
}

async function removeRole() {
  if (!activeRole.value) {
    return
  }

  const confirmed = window.confirm(`确认删除角色「${activeRole.value.name}」吗？`)

  if (!confirmed) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    await deleteAdminRole(activeRole.value.key)
    activeRoleKey.value = ''
    actionMessage.value = '角色已删除'
    await loadRoles()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  } finally {
    saving.value = false
  }
}

onMounted(loadRoles)
</script>

<template>
  <section class="page-title">
    <div>
      <p>Role Permission</p>
      <h1>角色权限</h1>
      <span>超级管理员可以新增角色，并给运营、财务、客服等角色勾选或取消权限点。</span>
    </div>
    <div class="title-actions">
      <button class="primary-action" type="button" @click="openCreateEditor">
        <Plus :size="16" />
        新增角色
      </button>
      <button class="secondary-button" type="button" :disabled="loading" @click="loadRoles">
        <RefreshCw :size="16" />
        刷新
      </button>
    </div>
  </section>

  <section class="metrics-row">
    <article class="metric-card">
      <span>角色数量</span>
      <strong>{{ roles.length }}</strong>
      <p>支持运营、财务、客服和后续新增角色。</p>
    </article>
    <article class="metric-card">
      <span>权限点</span>
      <strong>{{ totalPermissions }}</strong>
      <p>接口、菜单、按钮统一使用权限点。</p>
    </article>
    <article class="metric-card">
      <span>当前授权</span>
      <strong>{{ activePermissionCount }}</strong>
      <p>{{ activeRole?.isSystem ? '系统角色默认全部权限。' : '勾选后点击保存授权生效。' }}</p>
    </article>
  </section>

  <section v-if="errorMessage" class="notice error">{{ errorMessage }}</section>
  <section v-if="actionMessage" class="notice success">{{ actionMessage }}</section>

  <section class="role-layout">
    <aside class="panel role-list">
      <header class="panel-head">
        <div>
          <p>Role List</p>
          <h2>角色列表</h2>
        </div>
        <KeyRound :size="20" />
      </header>

      <button
        v-for="role in roles"
        :key="role.key"
        class="role-item"
        :class="{ active: activeRole?.key === role.key }"
        type="button"
        @click="selectRole(role)"
      >
        <span>
          <strong>{{ role.name }}</strong>
          <em>{{ role.description || role.key }}</em>
        </span>
        <i>{{ role.permissionCount }}</i>
      </button>
    </aside>

    <section class="panel matrix-panel">
      <header class="panel-head">
        <div>
          <p>Permission Matrix</p>
          <h2>{{ activeRole?.name || '权限矩阵' }}</h2>
        </div>
        <div class="panel-actions">
          <button class="secondary-button" type="button" @click="openEditEditor">
            <Pencil :size="16" />
            编辑角色
          </button>
          <button v-if="editableRole" class="danger-button" type="button" @click="removeRole">
            <Trash2 :size="16" />
            删除角色
          </button>
          <button class="primary-action" type="button" :disabled="!editableRole || saving" @click="savePermissions">
            <Save :size="16" />
            {{ saving ? '保存中' : '保存授权' }}
          </button>
          <ShieldCheck :size="21" />
        </div>
      </header>

      <p v-if="activeRole?.isSystem" class="system-note">系统角色默认拥有全部权限，不能在这里取消授权。</p>

      <div v-if="loading" class="empty-state">加载中...</div>

      <table v-else>
        <thead>
          <tr>
            <th>模块</th>
            <th>权限点</th>
            <th>说明</th>
            <th>授权</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groupedPermissions" :key="group.module">
            <tr v-for="item in group.items" :key="item.key">
              <td>{{ group.module }}</td>
              <td>
                <strong>{{ item.name }}</strong>
                <span>{{ item.key }}</span>
              </td>
              <td>{{ item.description }}</td>
              <td>
                <label class="permission-toggle" :class="{ disabled: !editableRole }">
                  <input
                    type="checkbox"
                    :checked="activeRole ? hasRolePermission(activeRole, item) : false"
                    :disabled="!editableRole"
                    @change="togglePermission(item.key)"
                  />
                  <span class="status-chip" :class="{ strong: activeRole && hasRolePermission(activeRole, item) }">
                    <CheckCircle2 v-if="activeRole && hasRolePermission(activeRole, item)" :size="14" />
                    {{ activeRole && hasRolePermission(activeRole, item) ? '已授权' : '未授权' }}
                  </span>
                </label>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <PaginationBar
        v-if="permissionTotal"
        v-model:page="permissionPage"
        v-model:page-size="permissionPageSize"
        :total="permissionTotal"
      />
    </section>
  </section>

  <Teleport to="body">
    <div v-if="editorMode" class="modal-backdrop" @click.self="closeEditor">
      <section class="modal-panel" role="dialog" aria-modal="true" :aria-label="editorTitle">
        <header class="panel-head">
          <div>
            <p>Role Form</p>
            <h2>{{ editorTitle }}</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" @click="closeEditor">
            <X :size="18" />
          </button>
        </header>

        <form class="role-form" @submit.prevent="submitRole">
          <div class="form-grid">
            <label>
              <span>角色标识</span>
              <input v-model.trim="form.key" type="text" :disabled="editorMode === 'edit'" required />
            </label>
            <label>
              <span>角色名称</span>
              <input v-model.trim="form.name" type="text" maxlength="64" required />
            </label>
            <label>
              <span>排序</span>
              <input v-model.number="form.sortOrder" type="number" />
            </label>
            <label class="switch-label">
              <input v-model="form.isActive" type="checkbox" :disabled="activeRole?.isSystem && editorMode === 'edit'" />
              启用角色
            </label>
            <label class="wide">
              <span>角色说明</span>
              <textarea v-model.trim="form.description" maxlength="255" rows="3" />
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
</template>

<style scoped>
.page-title,
.metrics-row,
.role-layout,
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

.title-actions,
.panel-actions,
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-action,
.secondary-button,
.danger-button,
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
.icon-button {
  padding: 0 12px;
  border: 1px solid var(--line);
  color: #344054;
  background: #fff;
}

.danger-button {
  padding: 0 12px;
  border: 1px solid #f1c4c4;
  color: var(--danger);
  background: #fff5f5;
}

.icon-button {
  width: 36px;
  padding: 0;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.role-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 14px;
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

.role-list {
  align-self: start;
  display: grid;
  gap: 10px;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  color: var(--text);
  background: #f8fbff;
  text-align: left;
}

.role-item.active,
.role-item:hover {
  border-color: rgba(216, 168, 77, 0.46);
  background: #fff8e8;
}

.role-item strong,
.role-item em {
  display: block;
}

.role-item em {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
}

.role-item i {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  color: #7a5616;
  background: rgba(216, 168, 77, 0.14);
  font-style: normal;
  font-weight: 900;
}

.matrix-panel {
  overflow-x: auto;
}

.system-note {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #7a5616;
  background: #fff7e6;
  font-size: 13px;
  font-weight: 800;
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
td span {
  display: block;
}

td span {
  margin-top: 5px;
  color: #7e8ea3;
  font-size: 12px;
}

.permission-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.permission-toggle input {
  width: 16px;
  height: 16px;
}

.permission-toggle.disabled {
  cursor: not-allowed;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
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
  min-height: 220px;
  place-items: center;
  color: var(--muted);
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
}

.role-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.role-form label {
  display: grid;
  gap: 8px;
}

.role-form label span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.role-form input,
.role-form textarea {
  width: 100%;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: #fff;
  outline: none;
}

.role-form textarea {
  padding: 10px 11px;
  resize: vertical;
}

.role-form input:disabled {
  color: #667085;
  background: #f5f7fb;
}

.switch-label {
  align-content: end;
  display: inline-flex !important;
  align-items: center;
  gap: 8px !important;
  min-height: 40px;
  color: #344054;
  font-weight: 800;
}

.switch-label input {
  width: 16px;
  height: 16px;
}

.wide {
  grid-column: 1 / -1;
}

.form-actions {
  justify-content: flex-end;
}

@media (max-width: 1180px) {
  .role-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 840px) {
  .page-title {
    align-items: stretch;
    flex-direction: column;
  }

  .title-actions,
  .panel-actions,
  .form-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .metrics-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-title,
  .metrics-row,
  .role-layout,
  .notice {
    margin-right: 14px;
    margin-left: 14px;
  }

  .page-title,
  .panel,
  .modal-panel {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    align-items: end;
    padding: 14px;
  }
}
</style>

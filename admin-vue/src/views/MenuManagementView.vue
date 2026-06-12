<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ChevronDown, ChevronRight, Pencil, Plus, RefreshCw, Save, Trash2, X } from '@lucide/vue'
import { createAdminMenu, deleteAdminMenu, getAdminMenus, updateAdminMenu } from '../api/menu'
import PaginationBar from '../components/PaginationBar.vue'
import { usePagination } from '../composables/usePagination'
import type { AdminMenu, AdminMenuPayload } from '../types/menu'
import type { PermissionCatalogItem } from '../types/permission'
import { resolveMenuIcon } from '../utils/menuIcons'

type EditorMode = 'create' | 'edit'
type MenuTableRow = AdminMenu & {
  childCount: number
  isExpanded: boolean
}

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')
const editorMode = ref<EditorMode | null>(null)
const selectedMenu = ref<AdminMenu | null>(null)
const menus = ref<AdminMenu[]>([])
const expandedDomainIds = ref<number[]>([])
const permissionCatalog = ref<PermissionCatalogItem[]>([])
const form = reactive<AdminMenuPayload>({
  parentId: null,
  menuKey: '',
  title: '',
  menuType: 'menu',
  icon: '',
  routeName: '',
  permissionKey: '',
  groupTitle: '',
  badge: '',
  sortOrder: 0,
  isVisible: true,
  isActive: true
})

const domainMenus = computed(() => menus.value.filter((menu) => menu.menuType === 'domain'))
const childrenByParent = computed(() => {
  const childrenByParent = new Map<number, AdminMenu[]>()

  menus.value.forEach((menu) => {
    if (!menu.parentId) {
      return
    }

    const children = childrenByParent.get(menu.parentId) ?? []
    children.push(menu)
    childrenByParent.set(menu.parentId, children)
  })

  return childrenByParent
})
const visibleMenuRows = computed<MenuTableRow[]>(() => {
  return domainMenus.value.flatMap((domain) => {
    const children = childrenByParent.value.get(domain.id) ?? []
    const isExpanded = expandedDomainIds.value.includes(domain.id)
    const domainRow: MenuTableRow = {
      ...domain,
      childCount: children.length,
      isExpanded
    }

    if (!isExpanded) {
      return [domainRow]
    }

    return [
      domainRow,
      ...children.map((child) => ({
        ...child,
        childCount: 0,
        isExpanded: false
      }))
    ]
  })
})
const {
  page: menuPage,
  pageSize: menuPageSize,
  total: menuTotal,
  pagedItems: pagedMenus
} = usePagination(visibleMenuRows)
const editorTitle = computed(() => (editorMode.value === 'create' ? '新增菜单' : `编辑菜单：${selectedMenu.value?.title}`))

function isDomainExpanded(id: number) {
  return expandedDomainIds.value.includes(id)
}

function toggleDomain(id: number) {
  if (isDomainExpanded(id)) {
    expandedDomainIds.value = expandedDomainIds.value.filter((item) => item !== id)
    return
  }

  expandedDomainIds.value = [...expandedDomainIds.value, id]
}

function expandAllDomains() {
  expandedDomainIds.value = domainMenus.value.map((menu) => menu.id)
}

function collapseAllDomains() {
  expandedDomainIds.value = []
}

function resetForm() {
  form.parentId = domainMenus.value[0]?.id ?? null
  form.menuKey = ''
  form.title = ''
  form.menuType = 'menu'
  form.icon = 'SquareDashedMousePointer'
  form.routeName = ''
  form.permissionKey = ''
  form.groupTitle = '权限与协同'
  form.badge = ''
  form.sortOrder = 0
  form.isVisible = true
  form.isActive = true
}

function fillForm(menu: AdminMenu) {
  form.parentId = menu.parentId
  form.menuKey = menu.menuKey
  form.title = menu.title
  form.menuType = menu.menuType
  form.icon = menu.icon ?? ''
  form.routeName = menu.routeName ?? ''
  form.permissionKey = menu.permissionKey ?? ''
  form.groupTitle = menu.groupTitle ?? ''
  form.badge = menu.badge ?? ''
  form.sortOrder = menu.sortOrder
  form.isVisible = menu.isVisible
  form.isActive = menu.isActive
}

function openCreateEditor(menuType: 'domain' | 'menu', parentId: number | null = null) {
  resetForm()
  form.menuType = menuType
  form.parentId = menuType === 'domain' ? null : parentId ?? domainMenus.value[0]?.id ?? null
  form.groupTitle = menuType === 'domain' ? '' : '权限与协同'
  selectedMenu.value = null
  editorMode.value = 'create'
  actionMessage.value = ''
  errorMessage.value = ''
}

function openEditEditor(menu: AdminMenu) {
  selectedMenu.value = menu
  fillForm(menu)
  editorMode.value = 'edit'
  actionMessage.value = ''
  errorMessage.value = ''
}

function closeEditor() {
  editorMode.value = null
  selectedMenu.value = null
  resetForm()
}

function buildPayload(): AdminMenuPayload {
  return {
    parentId: form.menuType === 'domain' ? null : form.parentId,
    menuKey: form.menuKey,
    title: form.title,
    menuType: form.menuType,
    icon: form.icon,
    routeName: form.menuType === 'domain' ? '' : form.routeName,
    permissionKey: form.permissionKey,
    groupTitle: form.menuType === 'domain' ? '' : form.groupTitle,
    badge: form.menuType === 'domain' ? '' : form.badge,
    sortOrder: Number(form.sortOrder),
    isVisible: form.isVisible,
    isActive: form.isActive
  }
}

async function loadMenus() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getAdminMenus()
    menus.value = result.menus
    expandedDomainIds.value = expandedDomainIds.value.filter((id) => result.menus.some((menu) => menu.id === id))
    permissionCatalog.value = result.permissionCatalog
    resetForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '菜单加载失败'
  } finally {
    loading.value = false
  }
}

async function submitEditor() {
  saving.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    const payload = buildPayload()

    if (editorMode.value === 'edit' && selectedMenu.value) {
      await updateAdminMenu(selectedMenu.value.id, payload)
      actionMessage.value = '菜单已保存'
    } else {
      await createAdminMenu(payload)
      actionMessage.value = '菜单已创建'
    }

    closeEditor()
    await loadMenus()

    if (payload.menuType === 'menu' && payload.parentId) {
      expandedDomainIds.value = Array.from(new Set([...expandedDomainIds.value, payload.parentId]))
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function removeMenu(menu: AdminMenu) {
  const confirmed = window.confirm(`确认删除菜单「${menu.title}」吗？`)

  if (!confirmed) {
    return
  }

  errorMessage.value = ''
  actionMessage.value = ''

  try {
    await deleteAdminMenu(menu.id)
    actionMessage.value = '菜单已删除'
    await loadMenus()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  }
}

onMounted(loadMenus)
</script>

<template>
  <section class="page-title">
    <div>
      <p>Menu Center</p>
      <h1>菜单管理</h1>
      <span>后台左侧菜单由后端返回，这里可以维护菜单层级、路由、图标、排序和绑定权限点。</span>
    </div>
    <div class="title-actions">
      <button class="primary-action" type="button" @click="openCreateEditor('domain')">
        <Plus :size="16" />
        新增一级
      </button>
      <button class="primary-action" type="button" @click="openCreateEditor('menu')">
        <Plus :size="16" />
        新增菜单
      </button>
      <button class="secondary-button" type="button" :disabled="loading" @click="loadMenus">
        <RefreshCw :size="16" />
        刷新
      </button>
    </div>
  </section>

  <section v-if="errorMessage" class="notice error">{{ errorMessage }}</section>
  <section v-if="actionMessage" class="notice success">{{ actionMessage }}</section>

  <section class="panel menu-panel">
    <header class="panel-head">
      <div>
        <p>Menu Tree</p>
        <h2>后台菜单</h2>
      </div>
      <div class="tree-actions">
        <button class="secondary-button" type="button" @click="expandAllDomains">
          <ChevronDown :size="16" />
          全部展开
        </button>
        <button class="secondary-button" type="button" @click="collapseAllDomains">
          <ChevronRight :size="16" />
          全部收起
        </button>
      </div>
    </header>

    <div v-if="loading" class="empty-state">加载中...</div>

    <table v-else>
      <thead>
        <tr>
          <th>菜单</th>
          <th>类型</th>
          <th>路由</th>
          <th>权限点</th>
          <th>排序</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="menu in pagedMenus"
          :key="menu.id"
          :class="{ domain: menu.menuType === 'domain', child: menu.menuType === 'menu' }"
        >
          <td>
            <div class="menu-cell">
              <button
                v-if="menu.menuType === 'domain'"
                class="expand-button"
                type="button"
                :title="menu.isExpanded ? '收起子菜单' : '展开子菜单'"
                @click="toggleDomain(menu.id)"
              >
                <ChevronDown v-if="menu.isExpanded" :size="16" />
                <ChevronRight v-else :size="16" />
              </button>
              <span v-else class="tree-spacer" />
              <component :is="resolveMenuIcon(menu.icon)" :size="18" />
              <div>
                <strong>{{ menu.title }}</strong>
                <em>
                  {{ menu.menuKey }}
                  <template v-if="menu.menuType === 'domain'"> · {{ menu.childCount }} 个子菜单</template>
                </em>
              </div>
            </div>
          </td>
          <td>{{ menu.menuType === 'domain' ? (menu.isExpanded ? '一级菜单 / 已展开' : '一级菜单 / 已收起') : '二级菜单' }}</td>
          <td>{{ menu.routeName || '-' }}</td>
          <td>{{ menu.permissionKey || '-' }}</td>
          <td>{{ menu.sortOrder }}</td>
          <td>
            <span class="status-chip" :class="{ strong: menu.isActive && menu.isVisible }">
              {{ menu.isActive ? (menu.isVisible ? '显示' : '隐藏') : '停用' }}
            </span>
          </td>
          <td>
            <div class="row-actions">
              <button v-if="menu.menuType === 'domain'" type="button" @click="openCreateEditor('menu', menu.id)">
                <Plus :size="15" />
                子菜单
              </button>
              <button type="button" @click="openEditEditor(menu)">
                <Pencil :size="15" />
                编辑
              </button>
              <button class="danger" type="button" @click="removeMenu(menu)">
                <Trash2 :size="15" />
                删除
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <PaginationBar
      v-if="menuTotal"
      v-model:page="menuPage"
      v-model:page-size="menuPageSize"
      :total="menuTotal"
    />
  </section>

  <Teleport to="body">
    <div v-if="editorMode" class="modal-backdrop" @click.self="closeEditor">
      <section class="modal-panel" role="dialog" aria-modal="true" :aria-label="editorTitle">
        <header class="panel-head">
          <div>
            <p>Menu Form</p>
            <h2>{{ editorTitle }}</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" @click="closeEditor">
            <X :size="18" />
          </button>
        </header>

        <form class="menu-form" @submit.prevent="submitEditor">
          <div class="form-grid">
            <label>
              <span>菜单类型</span>
              <select v-model="form.menuType">
                <option value="domain">一级菜单</option>
                <option value="menu">二级菜单</option>
              </select>
            </label>
            <label v-if="form.menuType === 'menu'">
              <span>所属一级</span>
              <select v-model.number="form.parentId" required>
                <option v-for="domain in domainMenus" :key="domain.id" :value="domain.id">{{ domain.title }}</option>
              </select>
            </label>
            <label>
              <span>菜单标识</span>
              <input v-model.trim="form.menuKey" type="text" required />
            </label>
            <label>
              <span>菜单名称</span>
              <input v-model.trim="form.title" type="text" maxlength="64" required />
            </label>
            <label>
              <span>图标名</span>
              <input v-model.trim="form.icon" type="text" placeholder="例如 MenuSquare" />
            </label>
            <label v-if="form.menuType === 'menu'">
              <span>路由名</span>
              <input v-model.trim="form.routeName" type="text" placeholder="例如 menu-management" />
            </label>
            <label>
              <span>权限点</span>
              <select v-model="form.permissionKey">
                <option value="">不绑定</option>
                <option v-for="permission in permissionCatalog" :key="permission.key" :value="permission.key">
                  {{ permission.name }} / {{ permission.key }}
                </option>
              </select>
            </label>
            <label v-if="form.menuType === 'menu'">
              <span>分组标题</span>
              <input v-model.trim="form.groupTitle" type="text" placeholder="例如 权限与协同" />
            </label>
            <label v-if="form.menuType === 'menu'">
              <span>徽标</span>
              <input v-model.trim="form.badge" type="text" maxlength="32" />
            </label>
            <label>
              <span>排序</span>
              <input v-model.number="form.sortOrder" type="number" />
            </label>
          </div>

          <div class="switch-row">
            <label>
              <input v-model="form.isVisible" type="checkbox" />
              显示菜单
            </label>
            <label>
              <input v-model="form.isActive" type="checkbox" />
              启用菜单
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
.menu-panel,
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
.tree-actions,
.row-actions,
.form-actions,
.switch-row {
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

.panel,
.modal-panel,
.notice {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
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

.menu-panel {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1080px;
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

tr.child td:first-child {
  padding-left: 38px;
}

tr.domain {
  background: #fcfdff;
}

td em {
  display: block;
  margin-top: 5px;
  color: #7e8ea3;
  font-size: 12px;
  font-style: normal;
}

.menu-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-button,
.tree-spacer {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
}

.expand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dce5f0;
  border-radius: 6px;
  color: #344054;
  background: #fff;
}

.expand-button:hover {
  border-color: rgba(216, 168, 77, 0.56);
  color: #7a5616;
  background: #fff8e8;
}

.tree-spacer {
  display: inline-block;
  position: relative;
}

.tree-spacer::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 4px;
  width: 14px;
  border-top: 1px solid #dce5f0;
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
  min-height: 260px;
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
  width: min(820px, 100%);
  max-height: min(820px, calc(100vh - 48px));
  overflow-y: auto;
}

.menu-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.menu-form label {
  display: grid;
  gap: 8px;
}

.menu-form label span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.menu-form input,
.menu-form select {
  width: 100%;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: #fff;
  outline: none;
}

.switch-row {
  flex-wrap: wrap;
}

.switch-row label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  color: #344054;
  font-weight: 800;
}

.switch-row input {
  width: 16px;
  height: 16px;
}

.form-actions {
  justify-content: flex-end;
}

@media (max-width: 840px) {
  .page-title {
    align-items: stretch;
    flex-direction: column;
  }

  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .title-actions,
  .tree-actions,
  .form-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .page-title,
  .menu-panel,
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

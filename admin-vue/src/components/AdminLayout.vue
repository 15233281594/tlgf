<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Bell, ChevronDown, LogOut, Menu, Search, Sparkles, UserRound } from '@lucide/vue'
import { getAdminNavigation } from '../api/menu'
import { useAuth } from '../composables/useAuth'
import type { AdminMenu } from '../types/menu'
import { resolveMenuIcon } from '../utils/menuIcons'

const { logout, user } = useAuth()
const route = useRoute()
const router = useRouter()
const activePrimary = ref('')
const userMenuOpen = ref(false)
const navigationMenus = ref<AdminMenu[]>([])
const navigationError = ref('')

const visiblePrimaryDomains = computed(() => navigationMenus.value.filter((menu) => menu.children?.length))
const visibleModuleItems = computed(() =>
  visiblePrimaryDomains.value.flatMap((domain) =>
    (domain.children ?? []).map((item) => ({
      ...item,
      domainKey: domain.menuKey
    }))
  )
)
const activeModuleItem = computed(() =>
  visibleModuleItems.value.find((item) => item.routeName === route.name)
)
const activeModule = computed(() => activeModuleItem.value?.menuKey ?? '')
const activePrimaryLabel = computed(() =>
  route.name === 'account'
    ? '账号中心'
    : (visiblePrimaryDomains.value.find((domain) => domain.menuKey === activePrimary.value)?.title ?? '后台')
)
const activeModuleLabel = computed(() =>
  activeModuleItem.value?.title ?? (route.name === 'account' ? '个人信息' : '工作台')
)
const visibleModuleGroups = computed(() =>
  (visiblePrimaryDomains.value.find((domain) => domain.menuKey === activePrimary.value)?.children ?? [])
    .reduce<Array<{ title: string; items: AdminMenu[] }>>((groups, item) => {
      const title = item.groupTitle || '默认分组'
      const group = groups.find((currentGroup) => currentGroup.title === title)

      if (group) {
        group.items.push(item)
        return groups
      }

      groups.push({
        title,
        items: [item]
      })
      return groups
    }, [])
)

watch(
  () => route.name,
  () => {
    userMenuOpen.value = false
  }
)

watch(
  [visiblePrimaryDomains, activeModuleItem],
  ([domains, item]) => {
    const nextPrimary = item?.domainKey ?? domains[0]?.menuKey ?? ''

    if (!activePrimary.value || item) {
      activePrimary.value = nextPrimary
    }
  },
  { immediate: true }
)

async function loadNavigation() {
  try {
    const result = await getAdminNavigation()
    navigationMenus.value = result.menus
    navigationError.value = ''
  } catch (error) {
    navigationError.value = error instanceof Error ? error.message : '菜单加载失败'
  }
}

function selectPrimaryDomain(domainId: string) {
  activePrimary.value = domainId

  const firstModule = visibleModuleItems.value.find((item) => item.domainKey === domainId)

  if (firstModule?.routeName && firstModule.routeName !== route.name) {
    router.push({ name: firstModule.routeName })
  }
}

function openModule(routeName: string) {
  if (routeName !== route.name) {
    router.push({ name: routeName })
  }
}

function openAccount() {
  router.push({ name: 'account' })
}

async function handleLogout() {
  await logout()
  await router.replace({ name: 'login' })
}

onMounted(loadNavigation)
</script>

<template>
  <section class="console-layout">
    <aside class="primary-rail">
      <div class="rail-logo">TL</div>
      <button
        v-for="domain in visiblePrimaryDomains"
        :key="domain.id"
        class="rail-button"
        :class="{ active: activePrimary === domain.menuKey }"
        type="button"
        :title="domain.title"
        @click="selectPrimaryDomain(domain.menuKey)"
      >
        <component :is="resolveMenuIcon(domain.icon)" :size="20" />
      </button>
    </aside>

    <aside class="module-sidebar">
      <header class="module-header">
        <div>
          <strong>TLGF Console</strong>
          <span>企业运营后台</span>
        </div>
        <button type="button" title="折叠菜单">
          <Menu :size="18" />
        </button>
      </header>

      <nav class="module-nav" aria-label="后台模块导航">
        <p v-if="navigationError" class="menu-error">{{ navigationError }}</p>
        <section v-for="group in visibleModuleGroups" :key="group.title">
          <p>{{ group.title }}</p>
          <button
            v-for="item in group.items"
            :key="item.id"
            class="module-item"
            :class="{ active: activeModule === item.menuKey }"
            type="button"
            @click="item.routeName && openModule(item.routeName)"
          >
            <component :is="resolveMenuIcon(item.icon)" :size="18" />
            <span>{{ item.title }}</span>
            <em v-if="item.badge">{{ item.badge }}</em>
          </button>
        </section>
      </nav>

      <footer class="sidebar-card">
        <Sparkles :size="18" />
        <div>
          <strong>第一阶段</strong>
          <span>先完成权限模型与后台框架。</span>
        </div>
      </footer>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="breadcrumb">
          <span>{{ activePrimaryLabel }}</span>
          <i>/</i>
          <strong>{{ activeModuleLabel }}</strong>
        </div>

        <div class="topbar-tools">
          <label class="search-field">
            <Search :size="17" />
            <input type="search" placeholder="搜索订单、页面、成员" />
          </label>
          <button class="icon-button" type="button" title="通知">
            <Bell :size="18" />
          </button>
          <div class="user-menu">
            <button class="user-button" type="button" @click="userMenuOpen = !userMenuOpen">
              <span>{{ user?.name.slice(0, 1) || 'A' }}</span>
              <strong>{{ user?.name }}</strong>
              <ChevronDown :size="16" />
            </button>

            <div v-if="userMenuOpen" class="user-dropdown">
              <button type="button" @click="openAccount">
                <UserRound :size="16" />
                个人信息
              </button>
              <button class="danger" type="button" @click="handleLogout">
                <LogOut :size="16" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <RouterView />

      <footer class="workspace-footer">
        <span>当前账号：{{ user?.email }}</span>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.console-layout {
  display: flex;
  align-items: stretch;
  height: 100vh;
  overflow: hidden;
}

.primary-rail {
  flex: 0 0 72px;
  width: 72px;
  height: 100vh;
  min-height: 0;
  display: grid;
  grid-template-rows: auto;
  grid-auto-rows: 48px;
  align-content: start;
  justify-items: center;
  gap: 10px;
  padding: 16px 0;
  background: var(--bg);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.rail-logo {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 215, 122, 0.38);
  border-radius: 8px;
  color: var(--gold-2);
  background: linear-gradient(135deg, rgba(216, 168, 77, 0.24), rgba(49, 212, 232, 0.1));
  font-weight: 900;
}

.rail-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 6px;
  color: #8fa0b2;
  background: transparent;
}

.rail-button.active,
.rail-button:hover {
  color: var(--gold-2);
  background: rgba(255, 215, 122, 0.1);
}

.module-sidebar {
  flex: 0 0 252px;
  width: 252px;
  height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 18px 14px;
  color: #d7e0ea;
  background: var(--surface);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 4px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.module-header strong {
  display: block;
  color: #fff;
}

.module-header span {
  display: block;
  margin-top: 3px;
  color: #8fa0b2;
  font-size: 12px;
}

.module-header button,
.icon-button {
  display: grid;
  place-items: center;
  border: 0;
}

.module-header button {
  width: 34px;
  height: 34px;
  color: #9fb0c0;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}

.module-nav {
  min-height: 0;
  flex: 1;
  display: grid;
  align-content: start;
  gap: 20px;
  overflow-y: auto;
  padding-top: 18px;
  padding-right: 4px;
}

.module-nav section {
  display: grid;
  gap: 6px;
}

.module-nav p {
  margin: 0 0 4px;
  padding: 0 10px;
  color: #7e8ea3;
  font-size: 12px;
  font-weight: 800;
}

.module-nav .menu-error {
  padding: 10px;
  border-radius: 6px;
  color: #ffd7d7;
  background: rgba(196, 61, 61, 0.16);
  line-height: 1.5;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  color: #b6c4d3;
  background: transparent;
  text-align: left;
}

.module-item span {
  flex: 1;
}

.module-item em {
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--gold-2);
  background: rgba(216, 168, 77, 0.13);
  font-size: 11px;
  font-style: normal;
}

.module-item.active,
.module-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.module-item.active svg {
  color: var(--gold-2);
}

.sidebar-card {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 14px 12px;
  border: 1px solid rgba(255, 215, 122, 0.16);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.04);
}

.sidebar-card strong {
  display: block;
  color: #fff;
  font-size: 13px;
}

.sidebar-card span {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.45;
}

.workspace {
  min-width: 0;
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  background: var(--page);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(12px);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
}

.breadcrumb i {
  color: #c3ccd8;
  font-style: normal;
}

.breadcrumb strong {
  color: var(--text);
}

.topbar-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 300px;
  min-height: 38px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: #98a2b3;
  background: #fff;
}

.search-field input {
  width: 100%;
  min-height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  outline: none;
  box-shadow: none;
}

.icon-button {
  width: 38px;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: #475467;
  background: #fff;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: #344054;
  background: #fff;
}

.user-menu {
  position: relative;
}

.user-button span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #06101b;
  background: var(--gold-2);
  font-weight: 900;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  width: 168px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: var(--shadow);
}

.user-dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  color: #344054;
  background: transparent;
  font-weight: 800;
  text-align: left;
}

.user-dropdown button:hover {
  background: #f5f7fb;
}

.user-dropdown button.danger {
  color: var(--danger);
}

.user-dropdown button.danger:hover {
  background: #fff5f5;
}

.workspace-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  margin: 20px 28px 0;
  padding-bottom: 24px;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 980px) {
  .console-layout {
    display: block;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .primary-rail,
  .module-sidebar {
    display: none;
  }

  .topbar {
    align-items: stretch;
    flex-direction: column;
    padding: 14px 16px;
  }

  .workspace {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .topbar-tools {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .search-field {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .workspace-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
    margin-right: 14px;
    margin-left: 14px;
  }
}
</style>

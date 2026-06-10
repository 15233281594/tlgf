<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { Bell, ChevronDown, LogOut, Menu, Search, Sparkles } from '@lucide/vue'
import { moduleGroups, primaryDomains } from '../data/admin'
import { useAuth } from '../composables/useAuth'

const { logout, user } = useAuth()
const activePrimary = ref('operation')
const activeModule = ref('dashboard')
</script>

<template>
  <section class="console-layout">
    <aside class="primary-rail">
      <div class="rail-logo">TL</div>
      <button
        v-for="domain in primaryDomains"
        :key="domain.id"
        class="rail-button"
        :class="{ active: activePrimary === domain.id }"
        type="button"
        :title="domain.label"
        @click="activePrimary = domain.id"
      >
        <component :is="domain.icon" :size="20" />
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
        <section v-for="group in moduleGroups" :key="group.title">
          <p>{{ group.title }}</p>
          <button
            v-for="item in group.items"
            :key="item.id"
            class="module-item"
            :class="{ active: activeModule === item.id }"
            type="button"
            @click="activeModule = item.id"
          >
            <component :is="item.icon" :size="18" />
            <span>{{ item.label }}</span>
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
          <span>运营中台</span>
          <i>/</i>
          <strong>权限优先工作台</strong>
        </div>

        <div class="topbar-tools">
          <label class="search-field">
            <Search :size="17" />
            <input type="search" placeholder="搜索订单、页面、成员" />
          </label>
          <button class="icon-button" type="button" title="通知">
            <Bell :size="18" />
          </button>
          <button class="user-button" type="button">
            <span>{{ user?.name.slice(0, 1) || 'A' }}</span>
            <strong>{{ user?.name }}</strong>
            <ChevronDown :size="16" />
          </button>
        </div>
      </header>

      <RouterView />

      <footer class="workspace-footer">
        <span>当前账号：{{ user?.email }}</span>
        <button type="button" @click="logout">
          <LogOut :size="16" />
          退出登录
        </button>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.console-layout {
  display: flex;
  align-items: stretch;
  min-height: 100vh;
}

.primary-rail {
  width: 72px;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto repeat(4, 48px) 1fr;
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
  width: 252px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  display: grid;
  gap: 20px;
  padding-top: 18px;
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

.workspace-footer button {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #f1c4c4;
  border-radius: 6px;
  color: var(--danger);
  background: #fff5f5;
  font-weight: 800;
}

@media (max-width: 980px) {
  .console-layout {
    display: block;
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

<script setup lang="ts">
import { ref } from 'vue'
import { builderBlocks, dashboardTabs, metrics, permissionRows } from '../data/admin'

const activeTab = ref('permission-overview')
</script>

<template>
  <section class="page-title">
    <div>
      <p>Permission Architecture</p>
      <h1>权限中心先行</h1>
      <span>后台的第一步是角色、菜单、按钮、数据范围和审计日志，后续客户端装修和订单支付都挂在这套权限下面。</span>
    </div>
    <div class="title-actions">
      <button class="secondary-button" type="button">查看规范</button>
      <button class="primary-action" type="button">新建角色</button>
    </div>
  </section>

  <section class="tabbar" aria-label="三级导航">
    <button
      v-for="tab in dashboardTabs"
      :key="tab.id"
      :class="{ active: activeTab === tab.id }"
      type="button"
      @click="activeTab = tab.id"
    >
      {{ tab.label }}
    </button>
  </section>

  <section class="metrics-row">
    <article v-for="item in metrics" :key="item.label" class="metric-card">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
      <p>{{ item.desc }}</p>
    </article>
  </section>

  <section class="main-grid">
    <section class="panel permissions-panel">
      <header class="panel-head">
        <div>
          <p>Role Matrix</p>
          <h2>权限矩阵</h2>
        </div>
        <button class="secondary-button" type="button">配置权限</button>
      </header>

      <table>
        <thead>
          <tr>
            <th>模块</th>
            <th>超级管理员</th>
            <th>财务</th>
            <th>客服</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in permissionRows" :key="row.module">
            <td>{{ row.module }}</td>
            <td><span class="status-chip strong">{{ row.admin }}</span></td>
            <td><span class="status-chip">{{ row.finance }}</span></td>
            <td><span class="status-chip muted">{{ row.service }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <aside class="panel publish-panel">
      <header class="panel-head">
        <div>
          <p>Publish Flow</p>
          <h2>后台发布链路</h2>
        </div>
      </header>

      <ol class="timeline">
        <li>
          <span />
          <div>
            <strong>权限校验</strong>
            <p>判断角色是否能编辑页面、价格和支付配置。</p>
          </div>
        </li>
        <li>
          <span />
          <div>
            <strong>保存草稿</strong>
            <p>配置先进入草稿版本，不直接影响客户端。</p>
          </div>
        </li>
        <li>
          <span />
          <div>
            <strong>发布生效</strong>
            <p>客户端读取最新发布版本，支持回滚。</p>
          </div>
        </li>
      </ol>
    </aside>
  </section>

  <section class="builder-section panel">
    <header class="panel-head">
      <div>
        <p>Client Builder</p>
        <h2>客户端装修模块骨架</h2>
      </div>
      <button class="secondary-button" type="button">打开装修器</button>
    </header>

    <div class="builder-grid">
      <article v-for="block in builderBlocks" :key="block.title" class="builder-card">
        <strong>{{ block.title }}</strong>
        <p>{{ block.desc }}</p>
      </article>

      <div class="client-preview">
        <div class="preview-nav" />
        <div class="preview-hero">
          <span />
          <strong />
        </div>
        <div class="preview-cards">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-title,
.tabbar,
.metrics-row,
.main-grid,
.builder-section {
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
    linear-gradient(90deg, #ffffff, #f8fbff);
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
  max-width: 780px;
  margin-top: 10px;
  color: var(--muted);
  line-height: 1.7;
}

.title-actions,
.panel-head {
  display: flex;
  align-items: center;
}

.title-actions {
  gap: 10px;
}

.primary-action,
.secondary-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  font-weight: 700;
}

.primary-action {
  border: 1px solid rgba(255, 215, 122, 0.42);
  color: #08101c;
  background: linear-gradient(135deg, #ffd77a, #c89236);
  font-weight: 800;
}

.secondary-button {
  border: 1px solid var(--line);
  color: #344054;
  background: #fff;
}

.tabbar {
  display: flex;
  gap: 4px;
  min-height: 44px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.tabbar button {
  min-width: 108px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  color: #475467;
  background: transparent;
  font-weight: 700;
}

.tabbar button.active,
.tabbar button:hover {
  color: #06101b;
  background: rgba(216, 168, 77, 0.16);
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.panel {
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

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 14px;
}

.panel {
  padding: 20px;
}

.panel-head {
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  height: 50px;
  padding: 0 12px;
  border-bottom: 1px solid #edf1f6;
  text-align: left;
  font-size: 14px;
}

th {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  color: #16665a;
  background: #e8f7f2;
  font-size: 12px;
  font-weight: 800;
}

.status-chip.strong {
  color: #7a5616;
  background: #fff4d7;
}

.status-chip.muted {
  color: #667085;
  background: #f1f4f8;
}

.timeline {
  display: grid;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline li {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 12px;
}

.timeline li > span {
  width: 12px;
  height: 12px;
  margin-top: 5px;
  border: 2px solid var(--gold);
  border-radius: 999px;
}

.timeline strong {
  display: block;
  font-size: 14px;
}

.timeline p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.builder-section {
  margin-bottom: 0;
}

.builder-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) 360px;
  gap: 12px;
}

.builder-card {
  min-height: 118px;
  padding: 14px;
  border: 1px solid #e3e9f2;
  border-radius: var(--radius);
  background: #f8fbff;
}

.builder-card strong {
  display: block;
}

.builder-card p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.client-preview {
  grid-row: span 2;
  min-height: 250px;
  padding: 14px;
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 20% 0, rgba(49, 212, 232, 0.18), transparent 12rem),
    #050810;
}

.preview-nav,
.preview-hero,
.preview-cards i {
  border-radius: 6px;
}

.preview-nav {
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
}

.preview-hero {
  display: grid;
  gap: 10px;
  align-content: end;
  height: 116px;
  margin-top: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 215, 122, 0.22), rgba(49, 212, 232, 0.1));
}

.preview-hero span,
.preview-hero strong {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.38);
}

.preview-hero strong {
  width: 64%;
}

.preview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.preview-cards i {
  height: 58px;
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 1280px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-grid,
  .builder-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .page-title {
    align-items: stretch;
    flex-direction: column;
  }

  .title-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .page-title,
  .panel {
    padding: 20px;
  }

  .metrics-row {
    grid-template-columns: 1fr;
  }

  .page-title,
  .tabbar,
  .metrics-row,
  .main-grid,
  .builder-section {
    margin-right: 14px;
    margin-left: 14px;
  }

  .tabbar {
    overflow-x: auto;
  }
}
</style>

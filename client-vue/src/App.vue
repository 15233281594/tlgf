<script setup lang="ts">
import HeroWebgl from './components/HeroWebgl.vue'
import PriceGrid from './components/PriceGrid.vue'
import ServiceFlow from './components/ServiceFlow.vue'
import SiteHeader from './components/SiteHeader.vue'
import TrustSection from './components/TrustSection.vue'
import { pricePlans, serviceHighlights, workflowSteps } from './data/home'
</script>

<template>
  <div class="site-shell">
    <main>
      <section class="intro-section" aria-label="峡谷入场动画">
        <HeroWebgl />
      </section>

      <SiteHeader />

      <section class="home-overview section" aria-labelledby="hero-title">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">英雄联盟陪玩店 · 段位业务 · 稳定接单</p>
            <h1 id="hero-title">专注峡谷段位服务的电竞陪玩工作室</h1>
            <p class="hero-lead">
              主打掉分陪练、娱乐陪玩、定位赛协助和账号状态维护。价格透明、进度可追踪、按段位和目标区间报价。
            </p>

            <div class="hero-actions" aria-label="首页快捷操作">
              <a class="primary-action" href="#pricing">查看段位价格</a>
              <a class="ghost-action" href="#process">了解服务流程</a>
            </div>

            <dl class="hero-stats" aria-label="平台数据">
              <div>
                <dt>24h</dt>
                <dd>在线排单</dd>
              </div>
              <div>
                <dt>6+</dt>
                <dd>段位区间</dd>
              </div>
              <div>
                <dt>1v1</dt>
                <dd>专属沟通</dd>
              </div>
            </dl>
          </div>

          <aside class="hero-panel" aria-label="热门订单面板">
            <div class="panel-header">
              <span>今日推荐</span>
              <strong>热门业务</strong>
            </div>
            <div class="order-stack">
              <article v-for="item in serviceHighlights" :key="item.title" class="order-card">
                <span class="order-badge">{{ item.badge }}</span>
                <h2>{{ item.title }}</h2>
                <p>{{ item.description }}</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <PriceGrid id="pricing" :plans="pricePlans" />
      <ServiceFlow id="process" :steps="workflowSteps" />
      <TrustSection />
    </main>
  </div>
</template>

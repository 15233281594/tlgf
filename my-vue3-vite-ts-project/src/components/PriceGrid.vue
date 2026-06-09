<script setup lang="ts">
import type { PricePlan } from '../data/home'

defineProps<{
  plans: PricePlan[]
}>()
</script>

<template>
  <section class="section pricing-section" aria-labelledby="pricing-title">
    <div class="container section-heading">
      <p class="eyebrow">透明报价</p>
      <h2 id="pricing-title">按段位区间快速估价</h2>
      <p>首页先放常规参考价，实际订单会根据隐藏分、胜率、时间要求和账号状态单独确认。</p>
    </div>

    <div class="container price-grid">
      <article v-for="plan in plans" :key="plan.tier" class="price-card" :class="`tone-${plan.tone}`">
        <div class="price-card-top">
          <span>{{ plan.range }}</span>
          <h3>{{ plan.tier }}</h3>
        </div>
        <div class="price-value">
          <strong>{{ plan.price }}</strong>
          <span>{{ plan.unit }}</span>
        </div>
        <ul>
          <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>

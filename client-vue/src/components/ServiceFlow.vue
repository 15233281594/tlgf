<script setup lang="ts">
import type { WorkflowStep } from '../data/home'

defineProps<{
  steps: WorkflowStep[]
}>()
</script>

<template>
  <section class="section process-section" aria-labelledby="process-title">
    <div class="container process-layout">
      <div class="section-heading process-copy">
        <p class="eyebrow">下单流程</p>
        <h2 id="process-title">从估价到交付，每一步都能跟上进度</h2>
        <p>先把业务规则讲清楚，再开始排单。首页不做复杂表单，后续可以接入在线咨询、订单系统和会员中心。</p>
      </div>

      <div class="timeline">
        <article v-for="step in steps" :key="step.label" class="timeline-item">
          <span>{{ step.label }}</span>
          <div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

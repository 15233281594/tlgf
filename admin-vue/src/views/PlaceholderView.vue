<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? '模块'))
const description = computed(() => String(route.meta.description ?? '模块骨架已经接入后台路由。'))
</script>

<template>
  <section class="placeholder-page">
    <div>
      <p>Module</p>
      <h1>{{ title }}</h1>
      <span>{{ description }}</span>
    </div>
  </section>
</template>

<style scoped>
.placeholder-page {
  min-height: calc(100vh - 140px);
  display: grid;
  place-items: center;
  margin: 20px 28px 0;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(255, 215, 122, 0.1), transparent 34%),
    #fff;
  box-shadow: var(--shadow);
}

.placeholder-page div {
  max-width: 560px;
  text-align: center;
}

.placeholder-page p {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.placeholder-page h1 {
  margin: 0;
  font-size: 30px;
}

.placeholder-page span {
  display: block;
  margin-top: 12px;
  color: var(--muted);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .placeholder-page {
    margin-right: 14px;
    margin-left: 14px;
    padding: 24px;
  }
}
</style>

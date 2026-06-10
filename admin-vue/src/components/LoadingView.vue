<template>
  <section class="loading-view">
    <span />
    <p>正在进入管理后台</p>
  </section>
</template>

<style scoped>
.loading-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  color: #cbd5e1;
  background: var(--bg);
}

.loading-view span {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--gold-2);
  border-radius: 999px;
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <section class="no-permission">
    <div>
      <p>Access Control</p>
      <h1>没有访问权限</h1>
      <span>当前账号没有打开该页面所需的权限。权限点已经由后端返回，前端路由和按钮会同步校验。</span>
    </div>
  </section>
</template>

<style scoped>
.no-permission {
  min-height: calc(100vh - 140px);
  display: grid;
  place-items: center;
  margin: 20px 28px 0;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(196, 61, 61, 0.08), transparent 34%),
    #fff;
  box-shadow: var(--shadow);
}

.no-permission div {
  max-width: 520px;
  text-align: center;
}

.no-permission p {
  margin: 0 0 8px;
  color: var(--danger);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.no-permission h1 {
  margin: 0;
  font-size: 30px;
}

.no-permission span {
  display: block;
  margin-top: 12px;
  color: var(--muted);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .no-permission {
    margin-right: 14px;
    margin-left: 14px;
    padding: 24px;
  }
}
</style>

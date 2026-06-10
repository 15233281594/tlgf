<script setup lang="ts">
import { ref } from 'vue'
import type { LoginPayload } from '../types/auth'

defineProps<{
  errorMessage: string
  submitting: boolean
}>()

const emit = defineEmits<{
  login: [payload: LoginPayload]
}>()

const email = ref('')
const password = ref('')

function handleSubmit() {
  emit('login', {
    email: email.value,
    password: password.value
  })
  password.value = ''
}
</script>

<template>
  <section class="login-view">
    <aside class="login-visual">
      <div class="product-logo">
        <span>TL</span>
        <strong>TLGF Admin</strong>
      </div>

      <div class="login-slogan">
        <p>Enterprise Console</p>
        <h1>统一运营后台</h1>
        <span>权限、客户端装修、订单和支付审核从同一套后台开始。</span>
      </div>

      <div class="visual-panel">
        <div class="visual-topline">
          <span />
          <strong>Access Control First</strong>
        </div>
        <div class="visual-grid">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </aside>

    <form class="login-card" @submit.prevent="handleSubmit">
      <div class="login-card-head">
        <p>管理员登录</p>
        <h2>登录控制台</h2>
      </div>

      <label class="form-field">
        <span>邮箱</span>
        <input v-model.trim="email" autocomplete="username" type="email" placeholder="admin@example.com" required />
      </label>

      <label class="form-field">
        <span>密码</span>
        <input v-model="password" autocomplete="current-password" type="password" placeholder="请输入密码" required />
      </label>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <button class="primary-button" type="submit" :disabled="submitting">
        {{ submitting ? '登录中' : '进入后台' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(420px, 0.95fr) minmax(420px, 1fr);
  background:
    radial-gradient(circle at 80% 16%, rgba(49, 212, 232, 0.16), transparent 28rem),
    #eef3f8;
}

.login-visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: #fff;
  background:
    linear-gradient(135deg, rgba(5, 8, 16, 0.94), rgba(9, 17, 29, 0.88)),
    radial-gradient(circle at 30% 14%, rgba(255, 215, 122, 0.18), transparent 24rem),
    radial-gradient(circle at 70% 62%, rgba(49, 212, 232, 0.14), transparent 26rem);
}

.product-logo,
.visual-topline {
  display: flex;
  align-items: center;
}

.product-logo {
  gap: 12px;
}

.product-logo span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 215, 122, 0.38);
  border-radius: 8px;
  color: var(--gold-2);
  background: linear-gradient(135deg, rgba(216, 168, 77, 0.24), rgba(49, 212, 232, 0.1));
  font-weight: 900;
}

.login-slogan p {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.login-slogan h1 {
  margin: 0;
  font-size: 56px;
  line-height: 1.05;
}

.login-slogan span {
  display: block;
  max-width: 470px;
  margin-top: 18px;
  color: #9fb0c0;
  font-size: 17px;
  line-height: 1.8;
}

.visual-panel {
  max-width: 460px;
  padding: 18px;
  border: 1px solid rgba(255, 215, 122, 0.18);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.04);
}

.visual-topline {
  gap: 10px;
  color: #dbeafe;
}

.visual-topline span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--green);
}

.visual-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.visual-grid i {
  height: 58px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(255, 215, 122, 0.22), rgba(49, 212, 232, 0.1));
}

.login-card {
  align-self: center;
  width: min(420px, calc(100% - 48px));
  margin: 0 auto;
  padding: 34px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.login-card-head p {
  margin: 0 0 8px;
  color: var(--muted);
  font-weight: 700;
}

.login-card-head h2 {
  margin: 0;
  font-size: 30px;
}

.form-field {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  color: #344054;
  font-size: 14px;
  font-weight: 700;
}

.form-field input {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  color: var(--text);
  background: #f8fafc;
  outline: none;
}

.form-field input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(216, 168, 77, 0.16);
}

.error-message {
  margin: 14px 0 0;
  color: var(--danger);
  font-size: 14px;
}

.primary-button {
  width: 100%;
  min-height: 42px;
  margin-top: 18px;
  border: 1px solid rgba(255, 215, 122, 0.42);
  border-radius: 6px;
  color: #08101c;
  background: linear-gradient(135deg, #ffd77a, #c89236);
  font-weight: 800;
}

.primary-button:disabled {
  opacity: 0.72;
}

@media (max-width: 980px) {
  .login-view {
    grid-template-columns: 1fr;
  }

  .login-visual {
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .login-visual,
  .login-card {
    padding: 20px;
  }

  .login-slogan h1 {
    font-size: 40px;
  }
}
</style>

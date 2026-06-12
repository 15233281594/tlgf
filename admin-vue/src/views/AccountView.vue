<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { KeyRound, Save, UserRound } from '@lucide/vue'
import { useAuth } from '../composables/useAuth'

const { changePassword, updateProfile, user } = useAuth()
const profileSaving = ref(false)
const passwordSaving = ref(false)
const profileMessage = ref('')
const passwordMessage = ref('')
const profileError = ref('')
const passwordError = ref('')
const profileForm = reactive({
  name: ''
})
const passwordForm = reactive({
  currentPassword: '',
  newPassword: ''
})

watch(
  user,
  (currentUser) => {
    profileForm.name = currentUser?.name ?? ''
  },
  { immediate: true }
)

async function submitProfile() {
  profileSaving.value = true
  profileMessage.value = ''
  profileError.value = ''

  try {
    await updateProfile({
      name: profileForm.name
    })
    profileMessage.value = '个人信息已保存'
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    profileSaving.value = false
  }
}

async function submitPassword() {
  passwordSaving.value = true
  passwordMessage.value = ''
  passwordError.value = ''

  try {
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordMessage.value = '密码已修改'
  } catch (error) {
    passwordError.value = error instanceof Error ? error.message : '密码修改失败'
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <section class="page-title">
    <div>
      <p>Account Center</p>
      <h1>个人信息</h1>
      <span>管理当前登录账号的基础资料和登录密码。</span>
    </div>
  </section>

  <section class="account-grid">
    <section class="panel">
      <header class="panel-head">
        <div>
          <p>Profile</p>
          <h2>基础资料</h2>
        </div>
        <UserRound :size="21" />
      </header>

      <form class="account-form" @submit.prevent="submitProfile">
        <label>
          <span>邮箱</span>
          <input :value="user?.email" type="email" disabled />
        </label>
        <label>
          <span>姓名</span>
          <input v-model.trim="profileForm.name" type="text" maxlength="64" required />
        </label>
        <label>
          <span>角色</span>
          <input :value="user?.role" type="text" disabled />
        </label>

        <p v-if="profileError" class="notice error">{{ profileError }}</p>
        <p v-if="profileMessage" class="notice success">{{ profileMessage }}</p>

        <footer>
          <button class="primary-action" type="submit" :disabled="profileSaving">
            <Save :size="16" />
            保存资料
          </button>
        </footer>
      </form>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <p>Password</p>
          <h2>修改密码</h2>
        </div>
        <KeyRound :size="21" />
      </header>

      <form class="account-form" @submit.prevent="submitPassword">
        <label>
          <span>当前密码</span>
          <input v-model="passwordForm.currentPassword" type="password" minlength="8" maxlength="72" required />
        </label>
        <label>
          <span>新密码</span>
          <input v-model="passwordForm.newPassword" type="password" minlength="8" maxlength="72" required />
        </label>

        <p v-if="passwordError" class="notice error">{{ passwordError }}</p>
        <p v-if="passwordMessage" class="notice success">{{ passwordMessage }}</p>

        <footer>
          <button class="primary-action" type="submit" :disabled="passwordSaving">
            <Save :size="16" />
            保存密码
          </button>
        </footer>
      </form>
    </section>
  </section>
</template>

<style scoped>
.page-title,
.account-grid {
  margin: 20px 28px 0;
}

.page-title {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(255, 215, 122, 0.12), transparent 32%),
    #fff;
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
  max-width: 760px;
  margin-top: 10px;
  color: var(--muted);
  line-height: 1.7;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.panel {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 20px;
}

.account-form {
  display: grid;
  gap: 14px;
}

.account-form label {
  display: grid;
  gap: 8px;
}

.account-form label span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.account-form input {
  width: 100%;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: #fff;
  outline: none;
}

.account-form input:disabled {
  color: #667085;
  background: #f5f7fb;
}

.account-form input:focus {
  border-color: rgba(216, 168, 77, 0.7);
  box-shadow: 0 0 0 3px rgba(216, 168, 77, 0.14);
}

.account-form footer {
  display: flex;
  justify-content: flex-end;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(255, 215, 122, 0.42);
  border-radius: 6px;
  color: #08101c;
  background: linear-gradient(135deg, #ffd77a, #c89236);
  font-weight: 800;
}

.notice {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
}

.notice.error {
  color: var(--danger);
  background: #fff5f5;
}

.notice.success {
  color: #16665a;
  background: #e8f7f2;
}

@media (max-width: 980px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-title,
  .account-grid {
    margin-right: 14px;
    margin-left: 14px;
  }

  .page-title,
  .panel {
    padding: 20px;
  }
}
</style>

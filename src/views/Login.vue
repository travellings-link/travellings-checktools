<template>
  <div class="max-w-md mx-auto text-center">
    <div class="mdui-prose">
      <h1>登录</h1>
    </div>
    <mdui-card class="p-5 my-10 sm:w-80%">
      <div>
        <mdui-avatar src="/icon.webp" slot="top" alt="图标"></mdui-avatar>
        <p>欢迎回来！</p>
        <p>登录到巡查工具</p>
        
        <form @submit.prevent="handleLogin" class="mt-5">
          <mdui-text-field
            v-model="email"
            type="email"
            label="邮箱"
            placeholder="请输入邮箱"
            required
            class="mb-4"
            full-width
            autocomplete="email"
            :error="error && !email ? '请输入邮箱' : ''"
          ></mdui-text-field>
          
          <mdui-text-field
            v-if="!useCode"
            v-model="password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            required
            class="mb-4"
            full-width
            autocomplete="current-password"
            :error="error && !password ? '请输入密码' : ''"
          ></mdui-text-field>
          
          <div v-if="useCode" class="mb-4">
            <mdui-text-field
              v-model="code"
              type="text"
              label="验证码"
              placeholder="请输入验证码"
              required
              full-width
              autocomplete="one-time-code"
              maxlength="6"
              :error="error && !code ? '请输入验证码' : ''"
            ></mdui-text-field>
            <mdui-button
              type="button"
              @click="sendCode"
              :disabled="codeSending || countdown > 0 || !email"
              :loading="codeSending"
              class="mt-2"
              full-width
              variant="outlined"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
            </mdui-button>
          </div>
          
          <div class="mb-4">
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="useCode"
                class="mr-2"
              />
              <span>使用验证码登录</span>
            </label>
          </div>
          
          <mdui-button
            type="submit"
            :loading="loading"
            :disabled="loading || !email || (!useCode && !password) || (useCode && !code)"
            full-width
            variant="filled"
          >
            登录
          </mdui-button>
        </form>
        
        <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {{ error }}
        </div>
      </div>
    </mdui-card>
  </div>
</template>

<script setup>
import '@mdui/icons/info--outlined.js'

import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { snackbar } from 'mdui/functions/snackbar.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const code = ref('')
const useCode = ref(false)
const loading = ref(false)
const error = ref('')
const codeSending = ref(false)
const countdown = ref(0)

async function sendCode() {
  if (!email.value) {
    snackbar({
      message: '请先输入邮箱',
      closeable: true
    })
    return
  }
  
  codeSending.value = true
  error.value = ''
  
  try {
    await authStore.sendCode(email.value)
    error.value = ''
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    snackbar({
      message: '验证码已发送（如未收到邮件，请查看控制台）',
      closeable: true
    })
  } catch (err) {
    error.value = err.response?.data?.msg || '发送验证码失败'
    snackbar({
      message: error.value,
      closeable: true
    })
  } finally {
    codeSending.value = false
  }
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    const success = await authStore.login(
      email.value,
      useCode.value ? null : password.value,
      useCode.value ? code.value : null
    )
    
    if (success) {
      snackbar({
        message: '登录成功',
        closeable: true
      })
      // 登录成功后跳转到原页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      error.value = '登录失败，请检查邮箱和密码/验证码'
      snackbar({
        message: error.value,
        closeable: true
      })
    }
  } catch (err) {
    error.value = err.response?.data?.msg || '登录失败'
    snackbar({
      message: error.value,
      closeable: true
    })
  } finally {
    loading.value = false
  }
}

// 页面加载时检查是否已登录
onMounted(() => {
  if (authStore.isAuthenticated) {
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  }
})
</script>

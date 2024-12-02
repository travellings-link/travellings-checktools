<template>
    <div class="m-auto text-center align-middle mdui-prose">
        <h1>提示信息</h1>
        <div v-if="notAdmin">
          <p>您不是管理员，无法使用巡查工具。</p>
          <p>您的登录身份是：{{ user || '未知' }}，这是否正确？</p>
          <p>如果不正确，请尝试更换一个 GitHub 账号。</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { ref } from 'vue';
import { useStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { isClient } from '@vueuse/core'
import api from '@/utils/tApi';

const notAdmin = ref(false)
const user = ref('')

if (isClient) {
  const tStorage = useStorage('tlogin', null)
  const router = useRouter()

  if (!tStorage.value) {
    router.push('/auth/login')
  } else {
    const res = await api.get('/user', {
      headers: {
        'Cookie': '_tlogin=' + tStorage.value,
      }
    })
    user.value = res.data.data.user
    if (res.data.data.role === 0) {
      router.push('/dashboard')
    } else {
        notAdmin.value = true
    }
  }
}

useHead({
    title: '提示信息 - 巡查工具 | 开往'
})
</script>
<template>
  <div class="mdui-prose max-w-full m-auto">
    <h1>仪表盘</h1>
    <OverviewCard :data="data" />
    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mt-8">
      <PendingApplications />
      <SiteLists :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { snackbar } from 'mdui/functions/snackbar.js'
import { isClient } from '@vueuse/core'

import api from '@/utils/tApi'

import { ref } from 'vue'

const data = ref({
  success: false,
  total: 0,
  data: []
})

onMounted(async () => {
  if (isClient) {
    const tStorage = useStorage('tlogin', null)
    const router = useRouter()

    if (!tStorage.value) {
      snackbar({
        message: '未授权的访问，请先登录。',
        closeable: true
      })
      router.push('/auth/login')
    } else if (tStorage.value) {
      try {
        const res = await api.get('user', {
          headers: {
            Cookie: `_tLogin=${tStorage.value}`
          }
        })
        if (res.data.role !== 0) {
          snackbar({
            message: '您没有权限访问此页面。',
            closeable: true
          })
          router.push('/notice')
        }
        const response = await api.get('/all')
        data.value = response.data
      } catch (error) {
        console.error(error)
      }
    }
  }
})

useHead({ title: '仪表盘 - 巡查工具 | 开往' })
</script>

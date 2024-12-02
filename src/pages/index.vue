<template></template>

<script setup lang="ts">
import { useHead, useSeoMeta } from '@unhead/vue'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useRouter } from 'vue-router'
import { isClient } from '@vueuse/core'
import { snackbar } from 'mdui/functions/snackbar.js'
import api from '@/utils/tApi'
import { onMounted } from 'vue'

onMounted(async () => {
  if (isClient) {
    const tStorage = useCookies(['_tlogin']).get('_tlogin')
    const router = useRouter()

    if (tStorage) {
      const res = await api.get('/user')
      if (res.data.data.role === 0) {
        snackbar({
          message: '已经以管理员 ' + res.data.data.username + ' 的身份登录。',
          closeable: true
        })
        router.push('/dashboard')
      } else if (res.data.data.role !== 0) {
        snackbar({
          message: '已经以用户 ' + res.data.data.username + ' 的身份登录。',
          closeable: true
        })
        router.push('/notice')
      } else {
        snackbar({
          message: '未授权的访问，请先登录。',
          closeable: true
        })
        router.push('/auth/login')
      }
    } else {
      router.push('/auth/login')
    }
  }
})

useHead({ title: '首页 - 巡查工具 | 开往' })

useSeoMeta({
  title: '首页 - 巡查工具 | 开往',
  description: '开往巡查组巡查工具',
  ogDescription: '开往巡查组巡查工具',
  ogTitle: '首页 - 巡查工具 | 开往',
  ogImage: '/icon.webp'
})
</script>

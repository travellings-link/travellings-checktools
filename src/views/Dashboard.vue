<template>
  <div class="mdui-prose max-w-5xl mx-auto">
    <h1>仪表盘</h1>
    <OverviewCard :stats="stats" />
    <div class="mt-8">
      <mdui-card class="p-5">
        <h2>快速操作</h2>
        <div class="flex flex-col sm:flex-row gap-3 mt-4">
          <mdui-button href="/check" variant="filled" size="large" class="flex-1">
            <mdui-icon-check slot="icon"></mdui-icon-check>
            开始巡查
          </mdui-button>
          <mdui-button href="/records" variant="outlined" size="large" class="flex-1">
            <mdui-icon-list slot="icon"></mdui-icon-list>
            查看记录
          </mdui-button>
          <mdui-button href="/reports" variant="outlined" size="large" class="flex-1">
            <mdui-icon-description slot="icon"></mdui-icon-description>
            提交报告
          </mdui-button>
        </div>
      </mdui-card>
    </div>
  </div>
</template>

<script setup>
import '@mdui/icons/check.js'
import '@mdui/icons/list.js'
import '@mdui/icons/description.js'
import { ref, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import api from '../api'
import OverviewCard from '../components/dashboard/OverviewCard.vue'

const stats = ref({})

async function fetchStats() {
  try {
    const response = await api.get('/stats/overview')
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('Fetch stats error:', error)
  }
}

onMounted(() => {
  fetchStats()
})

useHead({ title: '仪表盘 - 巡查工具 | 开往' })
</script>

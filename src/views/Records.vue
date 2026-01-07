<template>
  <div class="mdui-prose max-w-5xl mx-auto">
    <h1>巡查记录</h1>
    
    <mdui-card v-if="records.length === 0" class="p-10 text-center">
      <mdui-icon-inbox class="w-16 h-16 mx-auto mb-4 text-gray-400"></mdui-icon-inbox>
      <p class="text-gray-500">暂无巡查记录</p>
    </mdui-card>
    
    <div v-else class="space-y-4">
      <mdui-card v-for="record in records" :key="record.id" class="p-5">
        <div class="flex justify-between items-center mb-3">
          <span class="text-lg font-bold">{{ record.web?.name || '未知网站' }}</span>
          <span :class="['px-3 py-1 rounded-full text-sm', getStatusClass(record.check_result)]">
            {{ record.check_result }}
          </span>
        </div>
        <div class="text-gray-600">
          <p>网站: {{ record.web?.link }}</p>
          <p v-if="record.check_note">备注: {{ record.check_note }}</p>
          <p class="text-sm text-gray-500 mt-2">
            巡查时间: {{ formatTime(record.created_at) }}
          </p>
          <p v-if="record.user" class="text-sm text-gray-500">
            巡查人: {{ record.user.email }}
          </p>
        </div>
      </mdui-card>
    </div>
  </div>
</template>

<script setup>
import '@mdui/icons/inbox.js'
import { ref, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { snackbar } from 'mdui/functions/snackbar.js'
import api from '../api'

const records = ref([])

function getStatusClass(result) {
  if (result === '正常') return 'bg-green-100 text-green-800'
  if (result === '异常') return 'bg-red-100 text-red-800'
  if (result === '误报') return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-800'
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

async function fetchRecords() {
  try {
    const response = await api.get('/sites/all-records')
    console.log('Records API response:', response.data)
    if (response.data.success && response.data.data) {
      records.value = Array.isArray(response.data.data) ? response.data.data : []
      console.log('Records loaded:', records.value.length)
    } else {
      console.warn('No records data:', response.data)
      records.value = []
    }
  } catch (error) {
    console.error('Fetch records error:', error)
    snackbar({
      message: '获取巡查记录失败: ' + (error.response?.data?.msg || error.message),
      closeable: true
    })
  }
}

onMounted(() => {
  fetchRecords()
})

useHead({ title: '记录 - 巡查工具 | 开往' })
</script>

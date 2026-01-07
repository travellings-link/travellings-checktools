<template>
  <div class="mdui-prose max-w-5xl mx-auto">
    <h1>情况报告</h1>
    
    <div class="mb-5 flex justify-between items-center">
      <mdui-button @click="showSubmitForm = !showSubmitForm" variant="filled">
        {{ showSubmitForm ? '取消提交' : '提交报告' }}
      </mdui-button>
    </div>
    
    <mdui-card v-if="showSubmitForm" class="p-5 mb-5">
      <h2>提交新报告</h2>
      <form @submit.prevent="submitReport">
        <mdui-text-field
          v-model="newReport.title"
          label="标题"
          placeholder="请输入报告标题"
          class="mb-4"
          full-width
          required
        ></mdui-text-field>
        <mdui-text-field
          v-model="newReport.content"
          label="内容"
          placeholder="请输入报告内容"
          rows="6"
          class="mb-4"
          full-width
          multiline
          required
        ></mdui-text-field>
        <mdui-text-field
          v-model.number="newReport.web_id"
          type="number"
          label="关联网站ID（可选）"
          placeholder="网站ID"
          class="mb-4"
          full-width
        ></mdui-text-field>
        <div class="flex gap-2">
          <mdui-button type="submit" :loading="submitting">提交</mdui-button>
          <mdui-button type="button" @click="cancelSubmit" variant="outlined">取消</mdui-button>
        </div>
      </form>
    </mdui-card>
    
    <mdui-card v-if="reports.length === 0" class="p-10 text-center">
      <mdui-icon-inbox class="w-16 h-16 mx-auto mb-4 text-gray-400"></mdui-icon-inbox>
      <p class="text-gray-500">暂无报告</p>
    </mdui-card>
    
    <div v-else class="space-y-4">
      <mdui-card v-for="report in reports" :key="report.id" class="p-5">
        <div class="flex justify-between items-center mb-3">
          <h3>{{ report.title }}</h3>
          <div class="flex items-center gap-2">
            <span :class="['px-3 py-1 rounded-full text-sm', getStatusClass(report.status)]">
              {{ getStatusText(report.status) }}
            </span>
            <!-- 维护组可以更新报告状态 -->
            <div v-if="isAdmin" class="flex gap-1">
              <mdui-button 
                v-if="report.status !== 'pending'"
                @click="updateReportStatus(report, 'pending')" 
                size="small" 
                variant="text"
                title="标记为待处理"
              >
                待处理
              </mdui-button>
              <mdui-button 
                v-if="report.status !== 'processing'"
                @click="updateReportStatus(report, 'processing')" 
                size="small" 
                variant="text"
                title="标记为处理中"
              >
                处理中
              </mdui-button>
              <mdui-button 
                v-if="report.status !== 'resolved'"
                @click="updateReportStatus(report, 'resolved')" 
                size="small" 
                variant="text"
                title="标记为已解决"
              >
                已解决
              </mdui-button>
            </div>
          </div>
        </div>
        <p class="mb-3 whitespace-pre-wrap">{{ report.content }}</p>
        <div class="text-sm text-gray-500">
          <p>提交人: {{ report.user?.email }}</p>
          <p v-if="report.web">关联网站: <a :href="report.web.link" target="_blank" class="text-blue-500">{{ report.web.name }}</a> (ID: {{ report.web.id }})</p>
          <p>提交时间: {{ formatTime(report.created_at) }}</p>
          <p v-if="report.updated_at">更新时间: {{ formatTime(report.updated_at) }}</p>
        </div>
      </mdui-card>
    </div>
  </div>
</template>

<script setup>
import '@mdui/icons/inbox.js'
import '@mdui/icons/more-vert.js'
import { ref, onMounted, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { snackbar } from 'mdui/functions/snackbar.js'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const authStore = useAuthStore()
const reports = ref([])
const showSubmitForm = ref(false)
const submitting = ref(false)
const newReport = ref({
  title: '',
  content: '',
  web_id: null
})

const isAdmin = computed(() => authStore.user?.role === 1)

function getStatusClass(status) {
  const statusMap = {
    'pending': 'bg-orange-100 text-orange-800',
    'processing': 'bg-blue-100 text-blue-800',
    'resolved': 'bg-green-100 text-green-800'
  }
  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

function getStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'resolved': '已解决'
  }
  return statusMap[status] || status
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

async function fetchReports() {
  try {
    const response = await api.get('/reports/list')
    if (response.data.success) {
      reports.value = response.data.data
    }
  } catch (error) {
    console.error('Fetch reports error:', error)
  }
}

async function submitReport() {
  if (!newReport.value.title || !newReport.value.content) {
    snackbar({
      message: '请填写标题和内容',
      closeable: true
    })
    return
  }
  
  submitting.value = true
  try {
    await api.post('/reports/submit', newReport.value)
    snackbar({
      message: '报告提交成功',
      closeable: true
    })
    showSubmitForm.value = false
    newReport.value = { title: '', content: '', web_id: null }
    fetchReports()
  } catch (error) {
    snackbar({
      message: error.response?.data?.msg || '提交失败',
      closeable: true
    })
  } finally {
    submitting.value = false
  }
}

function cancelSubmit() {
  showSubmitForm.value = false
  newReport.value = { title: '', content: '', web_id: null }
}

async function updateReportStatus(report, status) {
  try {
    await api.put(`/reports/${report.id}/update`, { status })
    snackbar({
      message: '报告状态已更新',
      closeable: true
    })
    fetchReports()
  } catch (error) {
    snackbar({
      message: error.response?.data?.msg || '更新失败',
      closeable: true
    })
  }
}

onMounted(() => {
  fetchReports()
})

useHead({ title: '报告 - 巡查工具 | 开往' })
</script>

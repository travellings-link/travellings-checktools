<template>
  <div class="mdui-prose max-w-4xl mx-auto">
    <h1>网站巡查</h1>
    
    <div v-if="loading" class="text-center p-10">
      <mdui-circular-progress indeterminate></mdui-circular-progress>
      <p class="mt-4">正在获取巡查任务...</p>
    </div>
    
    <mdui-card v-if="noMoreSites && !currentSite && !showFinishMessage && !loading" class="p-10 text-center">
      <mdui-icon-check-circle class="w-16 h-16 mx-auto mb-4 text-green-500"></mdui-icon-check-circle>
      <h2>所有网站都已巡查完毕</h2>
      <p class="text-gray-600 mt-2">当前没有需要巡查的网站，请稍后再试</p>
      <mdui-button @click="resetCheck" class="mt-4">
        刷新
      </mdui-button>
    </mdui-card>
    
    <mdui-card v-else-if="currentSite && !showFinishMessage" class="p-5 my-5">
      <div class="site-info mb-5">
        <h2>{{ currentSite.name }}</h2>
        <p class="site-url">
          <a :href="currentSite.link" target="_blank" class="text-blue-500 hover:underline flex items-center gap-1">
            {{ currentSite.link }}
            <mdui-icon-open-in-new class="w-4 h-4"></mdui-icon-open-in-new>
          </a>
        </p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-sm text-gray-600">状态:</span>
          <span :class="['px-2 py-1 rounded text-sm', getStatusBadgeClass(currentSite.status)]">
            {{ currentSite.status }}
          </span>
        </div>
        <div v-if="currentSite.failedReason" class="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <strong>失败原因：</strong>{{ currentSite.failedReason }}
        </div>
      </div>
      
      <div class="check-form">
        <h3>巡查结果</h3>
        <mdui-radio-group class="mb-4" :value="checkResult" @change="(e) => checkResult = e.target.value">
          <mdui-radio value="正常" class="mb-2">正常</mdui-radio>
          <mdui-radio value="异常" class="mb-2">异常</mdui-radio>
          <mdui-radio value="误报" class="mb-2">误报</mdui-radio>
        </mdui-radio-group>
        
        <mdui-text-field
          v-model="checkNote"
          label="备注（可选）"
          placeholder="请输入备注信息"
          class="mb-4"
          full-width
          multiline
          rows="4"
        ></mdui-text-field>
        
        <div class="flex gap-2 flex-col sm:flex-row">
          <mdui-button
            @click="submitCheck"
            :disabled="!checkResult || submitting"
            :loading="submitting"
            full-width
            variant="filled"
          >
            提交并继续
          </mdui-button>
          <div class="flex gap-2 sm:w-auto w-full">
            <mdui-button
              @click="skipSite"
              :disabled="submitting"
              variant="outlined"
              class="flex-1"
            >
              跳过
            </mdui-button>
            <mdui-button
              @click="finishCheck"
              :disabled="submitting"
              variant="outlined"
              class="flex-1"
            >
              完成
            </mdui-button>
          </div>
        </div>
        <mdui-tooltip content="键盘快捷键：1=正常，2=异常，3=误报，Ctrl+Enter=提交，ESC=跳过">
          <p class="text-sm text-gray-500 mt-2 cursor-help">
            💡 提示：可以使用键盘快捷键快速操作
          </p>
        </mdui-tooltip>
      </div>
    </mdui-card>
    
    <mdui-card v-if="checkCount > 0" class="p-5 text-center">
      <p>本次已巡查 {{ checkCount }} 个网站</p>
    </mdui-card>
    
    <mdui-card v-if="showFinishMessage" class="p-10 text-center">
      <h2>🎉 巡查完成！</h2>
      <p>您本次共巡查了 <strong>{{ checkCount }}</strong> 个网站</p>
      <p>感谢您的辛勤工作！</p>
      <mdui-button @click="resetCheck" class="mt-4">
        继续巡查
      </mdui-button>
    </mdui-card>
  </div>
</template>

<script setup>
import '@mdui/icons/open-in-new.js'
import '@mdui/icons/check-circle.js'
import { ref, onMounted, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { snackbar } from 'mdui/functions/snackbar.js'
import api from '../api'

const currentSite = ref(null)
const checkResult = ref('')
const checkNote = ref('')
const submitting = ref(false)
const checkCount = ref(0)
const showFinishMessage = ref(false)
const loading = ref(false)
const noMoreSites = ref(false)

async function fetchNextSite() {
  loading.value = true
  noMoreSites.value = false
  
  try {
    const response = await api.get('/sites/next')
    console.log('Fetch next site response:', response.data)
    
    if (response.data.success) {
      // 检查是否有 data 字段且不为空
      if (response.data.data && Object.keys(response.data.data).length > 0) {
        // 有可巡查的网站
        currentSite.value = response.data.data
        checkResult.value = ''
        checkNote.value = ''
        noMoreSites.value = false
        console.log('Found site:', response.data.data.name)
      } else {
        // 没有可巡查的网站（success 为 true 但没有 data）
        currentSite.value = null
        noMoreSites.value = true
        console.log('No more sites available')
      }
    } else {
      // API 返回失败
      currentSite.value = null
      noMoreSites.value = true
      snackbar({
        message: response.data.msg || '获取巡查任务失败',
        closeable: true
      })
    }
  } catch (error) {
    console.error('Fetch next site error:', error)
    currentSite.value = null
    noMoreSites.value = true
    snackbar({
      message: error.response?.data?.msg || '获取巡查任务失败',
      closeable: true
    })
  } finally {
    loading.value = false
  }
}

async function submitCheck() {
  if (!checkResult.value) return
  
  submitting.value = true
  
  try {
    await api.post('/sites/check', {
      web_id: currentSite.value.id,
      check_result: checkResult.value,
      check_note: checkNote.value
    })
    
    checkCount.value++
    snackbar({
      message: '提交成功',
      closeable: true
    })
    await fetchNextSite()
  } catch (error) {
    snackbar({
      message: error.response?.data?.msg || '提交失败',
      closeable: true
    })
  } finally {
    submitting.value = false
  }
}

async function skipSite() {
  await fetchNextSite()
}

function finishCheck() {
  showFinishMessage.value = true
}

function resetCheck() {
  showFinishMessage.value = false
  checkCount.value = 0
  noMoreSites.value = false
  currentSite.value = null
  fetchNextSite()
}

function getStatusBadgeClass(status) {
  if (status === 'RUN') return 'bg-green-100 text-green-800'
  if (status === 'LOST') return 'bg-orange-100 text-orange-800'
  if (['ERROR', 'WAIT', 'TIMEOUT'].includes(status)) return 'bg-red-100 text-red-800'
  if (status?.startsWith('4') || status?.startsWith('5')) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

// 键盘快捷键支持
function handleKeyPress(event) {
  if (submitting.value || !currentSite.value) return
  
  // 数字键选择结果
  if (event.key === '1') {
    checkResult.value = '正常'
  } else if (event.key === '2') {
    checkResult.value = '异常'
  } else if (event.key === '3') {
    checkResult.value = '误报'
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && checkResult.value && !submitting.value) {
    // Ctrl+Enter 或 Cmd+Enter 提交
    event.preventDefault()
    submitCheck()
  } else if (event.key === 'Escape') {
    // ESC键跳过
    skipSite()
  }
}

onMounted(() => {
  fetchNextSite()
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

useHead({ title: '巡查 - 巡查工具 | 开往' })
</script>

<style scoped>
.site-url {
  word-break: break-all;
}
</style>

<template>
  <h2>总览</h2>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-insert-chart-outlined class="w-10 h-10"></mdui-icon-insert-chart-outlined>
        <p>站点总数量</p>
        <span class="text-2xl"
          ><b>{{ totalSites }} 个</b></span
        >
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-error-outline class="w-10 h-10"></mdui-icon-error-outline>
        <p>ERROR 站点总数量</p>
        <span class="text-2xl"
          ><b>{{ errorSites }} 个</b></span
        >
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-image-not-supported--outlined
          class="w-10 h-10"
        ></mdui-icon-image-not-supported--outlined>
        <p>无徽标站点总数量</p>
        <span class="text-2xl"
          ><b>{{ lostSites }} 个</b></span
        >
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-signal-wifi-connected-no-internet-4
          class="w-10 h-10"
        ></mdui-icon-signal-wifi-connected-no-internet-4>
        <p>巡查超时站点总数量</p>
        <span class="text-2xl"
          ><b>{{ timeoutSites }} 个</b></span
        >
      </div>
    </mdui-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck why reporting TS2551 for HTML elements?
import '@mdui/icons/insert-chart-outlined.js'
import '@mdui/icons/error-outline.js'
import '@mdui/icons/image-not-supported--outlined.js'
import '@mdui/icons/signal-wifi-connected-no-internet-4.js'

import { watch, ref } from 'vue'

const props = defineProps<{
  data: {
    success: boolean
    total: number
    data: Array<{
      id: number
      name: string
      status: string
      url: string
      tag: string
      failedReason: string | null
    }>
  }
}>()

const totalSites = ref(0)
const errorSites = ref(0)
const lostSites = ref(0)
const timeoutSites = ref(0)

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      totalSites.value = newData.total
      errorSites.value = newData.data.filter((site) => site.status === 'ERROR').length
      lostSites.value = newData.data.filter((site) => site.status === 'LOST').length
      timeoutSites.value = newData.data.filter((site) => site.status === 'TIMEOUT').length
    }
  },
  { immediate: true }
)
</script>

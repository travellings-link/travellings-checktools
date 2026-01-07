<template>
  <h2>总览</h2>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-insert-chart-outlined class="w-10 h-10"></mdui-icon-insert-chart-outlined>
        <p>站点总数量</p>
        <span class="text-2xl">
          <b>{{ stats.total_sites || 0 }} 个</b>
        </span>
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-check-circle class="w-10 h-10"></mdui-icon-check-circle>
        <p>正常运行</p>
        <span class="text-2xl">
          <b>{{ stats.run_sites || 0 }} 个</b>
        </span>
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-image-not-supported--outlined class="w-10 h-10"></mdui-icon-image-not-supported--outlined>
        <p>无徽标</p>
        <span class="text-2xl">
          <b>{{ stats.lost_sites || 0 }} 个</b>
        </span>
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-error-outline class="w-10 h-10"></mdui-icon-error-outline>
        <p>异常</p>
        <span class="text-2xl">
          <b>{{ (stats.error_sites || 0) + (stats.wait_sites || 0) + (stats.timeout_sites || 0) }} 个</b>
        </span>
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-today class="w-10 h-10"></mdui-icon-today>
        <p>今日巡查</p>
        <span class="text-2xl">
          <b>{{ stats.today_checks || 0 }} 个</b>
        </span>
      </div>
    </mdui-card>
    <mdui-card class="p-5 min-w-50">
      <div class="flex flex-col items-center">
        <mdui-icon-date-range class="w-10 h-10"></mdui-icon-date-range>
        <p>本周巡查</p>
        <span class="text-2xl">
          <b>{{ stats.week_checks || 0 }} 个</b>
        </span>
      </div>
    </mdui-card>
  </div>
</template>

<script setup>
import '@mdui/icons/insert-chart-outlined.js'
import '@mdui/icons/check-circle.js'
import '@mdui/icons/image-not-supported--outlined.js'
import '@mdui/icons/error-outline.js'
import '@mdui/icons/today.js'
import '@mdui/icons/date-range.js'

defineProps({
  stats: {
    type: Object,
    default: () => ({})
  }
})
</script>


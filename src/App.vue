<script setup>
import { setColorScheme } from 'mdui/functions/setColorScheme.js'
import { useDark } from '@vueuse/core'
import { setTheme } from 'mdui/functions/setTheme.js'
import Navbar from './components/Navbar.vue'

// 导入MDUI组件
import 'mdui/components/button.js'
import 'mdui/components/card.js'
import 'mdui/components/avatar.js'
import 'mdui/components/navigation-bar-item.js'
import 'mdui/components/navigation-bar.js'
import 'mdui/components/navigation-rail-item.js'
import 'mdui/components/navigation-rail.js'
import 'mdui/components/tooltip.js'
import 'mdui/components/list.js'
import 'mdui/components/list-item.js'
import 'mdui/components/collapse.js'
import 'mdui/components/collapse-item.js'
import 'mdui/components/text-field.js'
import 'mdui/components/fab.js'
import 'mdui/components/button-icon.js'
import 'mdui/components/circular-progress.js'
import 'mdui/components/radio-group.js'
import 'mdui/components/radio.js'
import 'mdui/components/dialog.js'

setColorScheme('#5cabff')

const isDark = useDark({
  onChanged(dark) {
    if (typeof document !== 'undefined') setTheme(dark ? 'dark' : 'light')
  }
})
</script>

<template>
  <Navbar />
  <div class="main-content">
    <router-view />
  </div>
</template>

<style>
:not(:defined) {
  visibility: hidden;
}

.main-content {
  padding: 1rem;
  min-height: calc(100vh - 64px);
}

/* 电脑端优化 */
@media (min-width: 768px) {
  .main-content {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* 大屏幕进一步优化 */
@media (min-width: 1200px) {
  .main-content {
    padding: 3rem 2rem;
  }
}
</style>

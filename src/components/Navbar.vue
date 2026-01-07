<template>
  <mdui-navigation-bar v-if="isMobile" :value="currentPage" scroll-behavior="hide">
    <mdui-navigation-bar-item href="/" value="/" @click.prevent="navigateTo('/')">
      <mdui-icon-dashboard slot="active-icon"></mdui-icon-dashboard>
      <mdui-icon-dashboard--outlined slot="icon" alt="仪表盘"></mdui-icon-dashboard--outlined>
      仪表盘
    </mdui-navigation-bar-item>
    <mdui-navigation-bar-item
      href="/check"
      value="/check"
      v-if="isAuthenticated"
      @click.prevent="navigateTo('/check')"
    >
      <mdui-icon-check slot="active-icon"></mdui-icon-check>
      <mdui-icon-check--outlined slot="icon"></mdui-icon-check--outlined>
      巡查
    </mdui-navigation-bar-item>
    <mdui-navigation-bar-item
      href="/login"
      value="/login"
      v-else
      @click.prevent="navigateTo('/login')"
    >
      <mdui-icon-login slot="icon"></mdui-icon-login>
      登录
    </mdui-navigation-bar-item>
  </mdui-navigation-bar>
  
  <mdui-navigation-rail v-else divider :value="currentPage">
    <mdui-avatar src="/icon.webp" slot="top" alt="图标"></mdui-avatar>
    <mdui-fab lowered slot="top" v-if="isAuthenticated" @click="handleLogout">
      <mdui-icon-logout slot="icon"></mdui-icon-logout>
    </mdui-fab>
    <mdui-fab
      lowered
      slot="top"
      v-else
      href="/login"
      @click.prevent="navigateTo('/login')"
    >
      <mdui-icon-login slot="icon"></mdui-icon-login>
    </mdui-fab>
    
    <mdui-navigation-rail-item href="/" value="/" @click.prevent="navigateTo('/')">
      <mdui-icon-dashboard slot="active-icon"></mdui-icon-dashboard>
      <mdui-icon-dashboard--outlined slot="icon" alt="仪表盘"></mdui-icon-dashboard--outlined>
      仪表盘
    </mdui-navigation-rail-item>
    
    <mdui-navigation-rail-item
      href="/check"
      value="/check"
      v-if="isAuthenticated"
      @click.prevent="navigateTo('/check')"
    >
      <mdui-icon-check slot="active-icon"></mdui-icon-check>
      <mdui-icon-check--outlined slot="icon"></mdui-icon-check--outlined>
      巡查
    </mdui-navigation-rail-item>
    
    <mdui-navigation-rail-item
      href="/records"
      value="/records"
      v-if="isAuthenticated"
      @click.prevent="navigateTo('/records')"
    >
      <mdui-icon-list slot="active-icon"></mdui-icon-list>
      <mdui-icon-list--outlined slot="icon"></mdui-icon-list--outlined>
      记录
    </mdui-navigation-rail-item>
    
    <mdui-navigation-rail-item
      href="/reports"
      value="/reports"
      v-if="isAuthenticated"
      @click.prevent="navigateTo('/reports')"
    >
      <mdui-icon-description slot="active-icon"></mdui-icon-description>
      <mdui-icon-description--outlined slot="icon"></mdui-icon-description--outlined>
      报告
    </mdui-navigation-rail-item>
    
    <mdui-navigation-rail-item
      href="/users"
      value="/users"
      v-if="isAuthenticated && user?.role === 1"
      @click.prevent="navigateTo('/users')"
    >
      <mdui-icon-people slot="active-icon"></mdui-icon-people>
      <mdui-icon-people--outlined slot="icon"></mdui-icon-people--outlined>
      用户
    </mdui-navigation-rail-item>
    
    <mdui-button-icon
      @click="toggleDark()"
      slot="bottom"
      alt="切换模式"
    >
      <mdui-tooltip placement="right" content="切换模式">
        <mdui-icon-brightness-6></mdui-icon-brightness-6>
      </mdui-tooltip>
    </mdui-button-icon>
  </mdui-navigation-rail>
</template>

<script setup>
import '@mdui/icons/brightness-6.js'
import '@mdui/icons/dashboard--outlined.js'
import '@mdui/icons/dashboard.js'
import '@mdui/icons/home--outlined.js'
import '@mdui/icons/home.js'
import '@mdui/icons/login.js'
import '@mdui/icons/logout.js'
import '@mdui/icons/check.js'
import '@mdui/icons/check--outlined.js'
import '@mdui/icons/list.js'
import '@mdui/icons/list--outlined.js'
import '@mdui/icons/description.js'
import '@mdui/icons/description--outlined.js'
import '@mdui/icons/people.js'
import '@mdui/icons/people--outlined.js'

import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark } from '@vueuse/core'
import { useToggle } from '@vueuse/shared'
import { setTheme } from 'mdui/functions/setTheme.js'
import { confirm } from 'mdui/functions/confirm.js'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const currentPage = ref(route.path)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)
const isMobile = computed(() => windowWidth.value < 768)
const isDark = useDark({
  onChanged(dark) {
    if (typeof document !== 'undefined') setTheme(dark ? 'dark' : 'light')
  }
})
const toggleDark = useToggle(isDark)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

function navigateTo(path) {
  router.push(path)
}

function handleLogout() {
  confirm({
    headline: '退出登录',
    description: '确定要退出登录吗？',
    confirmText: '确定',
    cancelText: '取消'
  }).then((result) => {
    if (result === 'confirm') {
      authStore.logout()
      router.push('/login')
    }
  }).catch(() => {
    // 如果用户取消，不做任何操作
  })
}

function updateWindowWidth() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWindowWidth)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWindowWidth)
  }
})

watch(route, (to) => {
  currentPage.value = to.path
})

watchEffect(() => {
  if (typeof document !== 'undefined') {
    if (isMobile.value) {
      document.body.style.paddingLeft = ''
    } else {
      document.body.style.paddingLeft = '81px'
    }
  }
})
</script>

<style scoped>
/* 给侧边栏图标添加圆角 */
:deep(mdui-navigation-rail-item) {
  --mdui-navigation-rail-item-icon-border-radius: 8px;
}

:deep(mdui-navigation-rail-item) mdui-icon,
:deep(mdui-navigation-rail-item) mdui-icon-dashboard,
:deep(mdui-navigation-rail-item) mdui-icon-dashboard--outlined,
:deep(mdui-navigation-rail-item) mdui-icon-check,
:deep(mdui-navigation-rail-item) mdui-icon-check--outlined,
:deep(mdui-navigation-rail-item) mdui-icon-list,
:deep(mdui-navigation-rail-item) mdui-icon-list--outlined,
:deep(mdui-navigation-rail-item) mdui-icon-description,
:deep(mdui-navigation-rail-item) mdui-icon-description--outlined,
:deep(mdui-navigation-rail-item) mdui-icon-people,
:deep(mdui-navigation-rail-item) mdui-icon-people--outlined {
  border-radius: 8px;
  padding: 4px;
  transition: all 0.2s ease;
  display: inline-block;
}

:deep(mdui-navigation-rail-item[selected]) mdui-icon,
:deep(mdui-navigation-rail-item[selected]) mdui-icon-dashboard,
:deep(mdui-navigation-rail-item[selected]) mdui-icon-check,
:deep(mdui-navigation-rail-item[selected]) mdui-icon-list,
:deep(mdui-navigation-rail-item[selected]) mdui-icon-description,
:deep(mdui-navigation-rail-item[selected]) mdui-icon-people {
  background-color: rgba(92, 171, 255, 0.1);
}

/* 移动端底部导航栏图标圆角 */
:deep(mdui-navigation-bar-item) mdui-icon,
:deep(mdui-navigation-bar-item) mdui-icon-dashboard,
:deep(mdui-navigation-bar-item) mdui-icon-dashboard--outlined,
:deep(mdui-navigation-bar-item) mdui-icon-check,
:deep(mdui-navigation-bar-item) mdui-icon-check--outlined,
:deep(mdui-navigation-bar-item) mdui-icon-login {
  border-radius: 8px;
  padding: 2px;
  transition: all 0.2s ease;
  display: inline-block;
}

:deep(mdui-navigation-bar-item[selected]) mdui-icon,
:deep(mdui-navigation-bar-item[selected]) mdui-icon-dashboard,
:deep(mdui-navigation-bar-item[selected]) mdui-icon-check {
  background-color: rgba(92, 171, 255, 0.1);
}
</style>


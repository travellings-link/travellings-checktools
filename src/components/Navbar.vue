<template>
  <mdui-navigation-bar v-if="isMobile" :value="currentPage" scroll-behavior="hide">
    <mdui-navigation-bar-item href="/" value="/" @click.prevent="navigateTo('/')"
      ><mdui-icon-home slot="active-icon"></mdui-icon-home
      ><mdui-icon-home--outlined slot="icon" alt="首页"></mdui-icon-home--outlined
      >首页</mdui-navigation-bar-item
    >
    <mdui-navigation-bar-item
      href="/dashboard"
      value="/dashboard"
      v-if="isLoggedIn"
      @click.prevent="navigateTo('/dashboard')"
      ><mdui-icon-dashboard slot="active-icon"></mdui-icon-dashboard
      ><mdui-icon-dashboard--outlined slot="icon"></mdui-icon-dashboard--outlined
      >仪表盘</mdui-navigation-bar-item
    >
    <mdui-navigation-bar-item
      href="/auth/login"
      value="/auth/login"
      v-else
      @click.prevent="navigateTo('/auth/login')"
    >
      <mdui-icon-login slot="icon"></mdui-icon-login>登录
    </mdui-navigation-bar-item>
  </mdui-navigation-bar>
  <mdui-navigation-rail v-else divider :value="currentPage">
    <mdui-avatar src="/icon.webp" slot="top" alt="图标"></mdui-avatar>
    <mdui-fab lowered slot="top" v-if="isLoggedIn" @click="logOut()">
      <mdui-icon-logout slot="icon"></mdui-icon-logout>
    </mdui-fab>
    <mdui-fab
      lowered
      slot="top"
      v-else
      href="/auth/login"
      @click.prevent="navigateTo('/auth/login')"
    >
      <mdui-icon-login slot="icon"></mdui-icon-login>
    </mdui-fab>
    <mdui-navigation-rail-item href="/" value="/" @click.prevent="navigateTo('/')"
      ><mdui-icon-home slot="active-icon"></mdui-icon-home
      ><mdui-icon-home--outlined slot="icon" alt="首页"></mdui-icon-home--outlined
      >首页</mdui-navigation-rail-item
    >
    <mdui-navigation-rail-item
      href="/dashboard"
      value="/dashboard"
      v-if="isLoggedIn"
      @click.prevent="navigateTo('/dashboard')"
      ><mdui-icon-dashboard slot="active-icon"></mdui-icon-dashboard
      ><mdui-icon-dashboard--outlined slot="icon"></mdui-icon-dashboard--outlined
      >仪表盘</mdui-navigation-rail-item
    >
    <mdui-navigation-rail-item
      href="/auth/login"
      value="/auth/login"
      v-else
      @click.prevent="navigateTo('/auth/login')"
    >
      <mdui-icon-login slot="icon"></mdui-icon-login>登录
    </mdui-navigation-rail-item>
    <mdui-button-icon
      href="https://github.com/travellings-link/travellings-checktools"
      target="_blank"
      slot="bottom"
      alt="源代码"
      ><mdui-tooltip placement="right" content="源代码"
        ><mdui-icon-source></mdui-icon-source></mdui-tooltip
    ></mdui-button-icon>
    <mdui-button-icon @click="toggleDark()" slot="bottom" alt="切换模式"
      ><mdui-tooltip placement="right" content="切换模式"
        ><mdui-icon-brightness-6></mdui-icon-brightness-6></mdui-tooltip
    ></mdui-button-icon>
  </mdui-navigation-rail>
</template>

<script lang="ts" setup>
// @ts-nocheck TS8010 why reporting error????
import '@mdui/icons/brightness-6.js'
import '@mdui/icons/dashboard--outlined.js'
import '@mdui/icons/dashboard.js'
import '@mdui/icons/home--outlined.js'
import '@mdui/icons/home.js'
import '@mdui/icons/login.js'
import '@mdui/icons/logout.js'
import '@mdui/icons/menu.js'
import '@mdui/icons/settings--outlined.js'
import '@mdui/icons/settings.js'
import '@mdui/icons/source.js'

import { useDark } from '@vueuse/core'
import { useToggle } from '@vueuse/shared'
import { confirm } from 'mdui/functions/confirm.js'
import { setTheme } from 'mdui/functions/setTheme.js'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isClient } from '@vueuse/core'
import { useCookies } from '@vueuse/integrations/useCookies'
import api from '@/utils/tApi.ts'

const tStorage = useCookies(['_tlogin'])
const token = tStorage.get('_tlogin')
const isMobile = computed(() => windowWidth.value < 768)
const route = useRoute()
const currentPage = ref(route.path)
const router = useRouter()
const windowWidth = ref(window.innerWidth)
const isLoggedIn = ref(false)
const isDark = useDark({
  onChanged(dark: boolean) {
    if (typeof document !== 'undefined') setTheme(dark ? 'dark' : 'light')
  }
})
const toggleDark = useToggle(isDark)
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

if (isClient) {
  if (token) {
    isLoggedIn.value = true
  } else {
    isLoggedIn.value = false
  }
}

function navigateTo(path) {
  router.push(path)
}

onMounted(() => {
  if (isClient) {
    window.addEventListener('resize', updateWindowWidth)
  }
})

onUnmounted(() => {
  if (isClient) {
    window.removeEventListener('resize', updateWindowWidth)
  }
})

watch(route, (to) => {
  currentPage.value = to.path
})

if (isClient) {
  watch(token, (value) => {
    if (value) {
      isLoggedIn.value = true
    } else {
      isLoggedIn.value = false
    }
  })
}

watchEffect(() => {
  if (isMobile.value) {
    document.body.style.paddingLeft = ''
  } else {
    document.body.style.paddingLeft = '81px'
  }
})

async function logOut() {
  confirm({
    title: '退出登录',
    content: '确定要退出登录吗？',
    onConfirm() {
      if (isClient) {
        try {
          const res = api.post('/logout', {
            headers: {
              'Cookie': `_tLogin=${token}`
            }
          })
          tStorage.remove('_tlogin')
        } catch (error) {
          console.error('Logout failed:', error)
        }
      }
    }
  })
}
</script>

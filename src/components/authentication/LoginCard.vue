<template>
  <mdui-card class="p-5 my-10 sm:w-80%">
    <div class="">
      <mdui-avatar src="/icon.webp" slot="top" alt="图标"></mdui-avatar>
      <p>欢迎回来！</p>
      <p>登录到您的 GitHub 账户以使用巡查工具。</p>
      <mdui-button
        full-width
        @click="redirectToGitHub"
        :loading="redirecting"
        :disabled="redirecting"
      >
        <div slot="icon" class="i-mdi-github"></div>
        <mdui-icon-open-in-new slot="end-icon"></mdui-icon-open-in-new>
        使用 GitHub 登录
      </mdui-button>
    </div>
  </mdui-card>
</template>

<script lang="ts" setup>
import '@mdui/icons/info--outlined.js'
import '@mdui/icons/open-in-new.js'
import { isClient } from '@vueuse/shared'
import { ref } from 'vue'

const redirecting = ref(false)

function redirectToGitHub() {
  if (isClient) {
    redirecting.value = true
    window.location.href =
      'https://api.travellings.cn/login/github?redirect_url=https://check-tools.travellings.cn/'
  }
}
</script>

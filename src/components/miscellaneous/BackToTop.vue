<template>
  <mdui-fab class="hidden z-1919810 fixed bottom-10 right-10 md:block" @click="backToTop"><mdui-icon-arrow-upward slot="icon"></mdui-icon-arrow-upward></mdui-fab>
</template>

<script setup lang="ts">
import '@mdui/icons/arrow-upward.js';
import { isClient } from '@vueuse/core'

function backToTop() {
    if (isClient) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }
}
</script>

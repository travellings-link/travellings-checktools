<template>
    <div class="mdui-prose max-w-3xl m-auto">
        <h1>未找到页面</h1>
        <p>看起来这个页面不存在……</p>
    </div>
    <div class="max-w-3xl m-auto mt-5 mb-5">
        <RouterLink to="/"><mdui-button>返回首页<mdui-icon-home
                    slot="icon"></mdui-icon-home><mdui-icon-arrow-forward
                    slot="end-icon"></mdui-icon-arrow-forward></mdui-button></RouterLink>
    </div>
</template>

<script setup lang="ts">
import '@mdui/icons/arrow-forward.js';
import '@mdui/icons/home.js';
import { useHead } from '@unhead/vue';

useHead({ title: '未找到页面 - 巡查工具 | 开往', })
</script>
<template>
    <div class="max-w-3xl m-auto text-center">
        <div class="mdui-prose">
            <h1>登录</h1>
        </div>
        <LoginCard />
    </div>
</template>

<script lang="ts" setup>
import { useHead } from '@unhead/vue';

useHead({ title: '登录 - 巡查工具 | 开往', })
</script>

<template>
  <div>
    <h2>站点列表</h2>
    <mdui-card class="w-full">
      <mdui-list>
        <mdui-collapse accordion class="max-h-sm overflow-y-scroll">
          <mdui-collapse-item>
            <mdui-list-item slot="header">
              <mdui-icon-expand-more slot="end-icon"></mdui-icon-expand-more
              ><mdui-icon-error-outline slot="icon"></mdui-icon-error-outline>ERROR
              状态</mdui-list-item
            >
            <div class="ml-10">
              <div v-for="site in errorSitesList" :key="site.id">
                <mdui-tooltip :content="site.failedReason">
                  <mdui-list-item
                    :href="
                      `https://github.com/travellings-link/travellings/issues?q=is%3Aissue+` +
                      site.url
                    "
                    target="_blank"
                    >{{ site.id }} - {{ site.name }}</mdui-list-item
                  >
                </mdui-tooltip>
              </div>
            </div>
          </mdui-collapse-item>
          <mdui-collapse-item>
            <mdui-list-item slot="header">
              <mdui-icon-expand-more slot="end-icon"></mdui-icon-expand-more
              ><mdui-icon-image-not-supported--outlined
                slot="icon"
              ></mdui-icon-image-not-supported--outlined
              >无徽标</mdui-list-item
            >
            <div class="ml-10">
              <div v-for="site in lostSitesList" :key="site.id">
                <mdui-list-item
                  :href="
                    `https://github.com/travellings-link/travellings/issues?q=is%3Aissue+` +
                    site.url
                  "
                  target="_blank"
                  >{{ site.id }} - {{ site.name }}</mdui-list-item
                >
              </div>
            </div>
          </mdui-collapse-item>
          <mdui-collapse-item>
            <mdui-list-item slot="header">
              <mdui-icon-expand-more slot="end-icon"></mdui-icon-expand-more
              ><mdui-icon-signal-wifi-connected-no-internet-4
                slot="icon"
              ></mdui-icon-signal-wifi-connected-no-internet-4
              >巡查超时</mdui-list-item
            >
            <div class="ml-10">
              <div v-for="site in timeoutSitesList" :key="site.id">
                <mdui-tooltip :content="site.failedReason">
                  <mdui-list-item
                    :href="
                      `https://github.com/travellings-link/travellings/issues?q=is%3Aissue+` +
                      site.url
                    "
                    target="_blank"
                    >{{ site.id }} - {{ site.name }}</mdui-list-item
                  >
                </mdui-tooltip>
              </div>
            </div>
          </mdui-collapse-item>
        </mdui-collapse>
      </mdui-list>
    </mdui-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck why reporting TS2551 for HTML elements?
import { ref, watch } from 'vue'

import '@mdui/icons/error-outline.js'
import '@mdui/icons/image-not-supported--outlined.js'
import '@mdui/icons/signal-wifi-connected-no-internet-4.js'
import '@mdui/icons/expand-more.js'

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
const errorSitesList = ref<
  Array<{
    id: number
    name: string
    status: string
    url: string
    tag: string
    failedReason: string | null
  }>
>([])
const lostSitesList = ref<
  Array<{
    id: number
    name: string
    status: string
    url: string
    tag: string
    failedReason: string | null
  }>
>([])
const timeoutSitesList = ref<
  Array<{
    id: number
    name: string
    status: string
    url: string
    tag: string
    failedReason: string | null
  }>
>([])

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      totalSites.value = newData.total
      errorSites.value = newData.data.filter((site) => site.status === 'ERROR').length
      lostSites.value = newData.data.filter((site) => site.status === 'LOST').length
      timeoutSites.value = newData.data.filter((site) => site.status === 'TIMEOUT').length
      errorSitesList.value = newData.data.filter((site) => site.status === 'ERROR')
      lostSitesList.value = newData.data.filter((site) => site.status === 'LOST')
      timeoutSitesList.value = newData.data.filter((site) => site.status === 'TIMEOUT')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <h2>待处理项目</h2>
    <mdui-card class="w-full">
      <mdui-list>
        <mdui-list-subheader>申请收录</mdui-list-subheader>
        <mdui-list-item
          v-for="issue in newApplications"
          :key="issue.id"
          :href="issue.html_url"
          target="_blank"
        >
          #{{ issue.number }} - {{ issue.title }}
        </mdui-list-item>
        <mdui-list-subheader>申请变更</mdui-list-subheader>
        <mdui-list-item
          v-for="issue in editApplications"
          :key="issue.id"
          :href="issue.html_url"
          target="_blank"
        >
          #{{ issue.number }} - {{ issue.title }}
        </mdui-list-item>
      </mdui-list>
    </mdui-card>
  </div>
  <mdui-card class="h-fit md:mt-18.5 w-full">
    <mdui-list>
      <mdui-list-subheader>组内待议</mdui-list-subheader>
      <mdui-list-item
        v-for="issue in waitingApplications"
        :key="issue.id"
        :href="issue.html_url"
        target="_blank"
      >
        #{{ issue.number }} - {{ issue.title }}
      </mdui-list-item>
    </mdui-list>
  </mdui-card>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'

interface Issue {
  id: number
  title: string
  number: number
  html_url: string
}

const newApplications = ref<Issue[]>([])
const editApplications = ref<Issue[]>([])
const waitingApplications = ref<Issue[]>([])

onMounted(async () => {
  const [newResponse, editResponse, waitingResponse] = await Promise.all([
    axios.get(
      'https://api.github.com/repos/travellings-link/travellings/issues?labels=%E5%BE%85%E5%A4%84%E7%90%86,%E7%94%B3%E8%AF%B7%E6%94%B6%E5%BD%95'
    ),
    axios.get(
      'https://api.github.com/repos/travellings-link/travellings/issues?labels=%E5%BE%85%E5%A4%84%E7%90%86,%E7%94%B3%E8%AF%B7%E5%8F%98%E6%9B%B4%E4%BF%A1%E6%81%AF'
    ),
    axios.get(
      'https://api.github.com/repos/travellings-link/travellings/issues?labels=%E7%BB%84%E5%86%85%E5%BE%85%E8%AE%AE'
    )
  ])
  newApplications.value = newResponse.data
  editApplications.value = editResponse.data
  waitingApplications.value = waitingResponse.data
})
</script>

<template>
  <div class="mdui-prose max-w-6xl mx-auto">
    <h1>用户管理</h1>
    
    <div class="mb-5 flex justify-between items-center">
      <mdui-button @click="showAddForm = !showAddForm" variant="filled">
        {{ showAddForm ? '取消添加' : '添加用户' }}
      </mdui-button>
    </div>
    
    <mdui-card v-if="showAddForm" class="p-5 mb-5">
      <h2>添加新用户</h2>
      <form @submit.prevent="addUser">
        <mdui-text-field
          v-model="newUser.email"
          type="email"
          label="邮箱"
          placeholder="请输入邮箱"
          class="mb-4"
          full-width
          required
        ></mdui-text-field>
        <mdui-text-field
          v-model="newUser.password"
          type="password"
          label="密码（可选，不设置则只能使用验证码登录）"
          placeholder="请输入密码"
          class="mb-4"
          full-width
        ></mdui-text-field>
        <div class="mb-4">
          <label>角色</label>
          <select v-model.number="newUser.role" class="block w-full p-2 border rounded">
            <option :value="0">巡查组成员</option>
            <option :value="1">维护组成员</option>
          </select>
        </div>
        <div class="flex gap-2">
          <mdui-button type="submit" :loading="submitting">添加</mdui-button>
          <mdui-button type="button" @click="cancelAdd" variant="outlined">取消</mdui-button>
        </div>
      </form>
    </mdui-card>
    
    <mdui-card class="p-5">
      <table class="w-full">
        <thead>
          <tr class="border-b">
            <th class="text-left p-3">ID</th>
            <th class="text-left p-3">邮箱</th>
            <th class="text-left p-3">角色</th>
            <th class="text-left p-3">状态</th>
            <th class="text-left p-3">最后登录</th>
            <th class="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b">
            <td class="p-3">{{ user.id }}</td>
            <td class="p-3">{{ user.email }}</td>
            <td class="p-3">{{ user.role === 1 ? '维护组' : '巡查组' }}</td>
            <td class="p-3">
              <span :class="['px-2 py-1 rounded text-sm', user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800']">
                {{ user.isActive ? '活跃' : '禁用' }}
              </span>
            </td>
            <td class="p-3">{{ formatTime(user.lastLogin) }}</td>
            <td class="p-3">
              <mdui-button
                @click="editUser(user)"
                variant="text"
                size="small"
                class="mr-2"
              >
                编辑
              </mdui-button>
              <mdui-button
                v-if="user.id !== currentUser.id"
                @click="toggleUserStatus(user)"
                variant="text"
                size="small"
              >
                {{ user.isActive ? '禁用' : '启用' }}
              </mdui-button>
            </td>
          </tr>
        </tbody>
      </table>
    </mdui-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { snackbar } from 'mdui/functions/snackbar.js'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const authStore = useAuthStore()
const users = ref([])
const showAddForm = ref(false)
const submitting = ref(false)
const newUser = ref({
  email: '',
  password: '',
  role: 0
})
const currentUser = ref(authStore.user)

function formatTime(timeStr) {
  if (!timeStr) return '从未登录'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

async function fetchUsers() {
  try {
    const response = await api.get('/users/list')
    if (response.data.success) {
      users.value = response.data.data
    }
  } catch (error) {
    console.error('Fetch users error:', error)
  }
}

async function addUser() {
  if (!newUser.value.email) {
    snackbar({
      message: '请输入邮箱',
      closeable: true
    })
    return
  }
  
  submitting.value = true
  try {
    await api.post('/users/add', newUser.value)
    snackbar({
      message: '用户添加成功',
      closeable: true
    })
    showAddForm.value = false
    newUser.value = { email: '', password: '', role: 0 }
    fetchUsers()
  } catch (error) {
    snackbar({
      message: error.response?.data?.msg || '添加失败',
      closeable: true
    })
  } finally {
    submitting.value = false
  }
}

function cancelAdd() {
  showAddForm.value = false
  newUser.value = { email: '', password: '', role: 0 }
}

async function toggleUserStatus(user) {
  try {
    await api.put(`/users/${user.id}/update`, {
      isActive: !user.isActive
    })
    snackbar({
      message: '操作成功',
      closeable: true
    })
    fetchUsers()
  } catch (error) {
    snackbar({
      message: error.response?.data?.msg || '操作失败',
      closeable: true
    })
  }
}

function editUser(user) {
  const password = prompt('请输入新密码（留空则不修改）:')
  if (password === null) return
  
  const role = prompt('请输入角色（0: 巡查组, 1: 维护组）:', user.role)
  if (role === null) return
  
  api.put(`/users/${user.id}/update`, {
    password: password || undefined,
    role: parseInt(role)
  }).then(() => {
    snackbar({
      message: '更新成功',
      closeable: true
    })
    fetchUsers()
  }).catch(error => {
    snackbar({
      message: error.response?.data?.msg || '更新失败',
      closeable: true
    })
  })
}

onMounted(() => {
  fetchUsers()
})

useHead({ title: '用户管理 - 巡查工具 | 开往' })
</script>

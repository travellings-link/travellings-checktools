import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email, password, code) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        code
      })
      
      if (response.data.success) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        localStorage.setItem('token', token.value)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async function sendCode(email) {
    try {
      const response = await api.post('/auth/send-code', { email })
      return response.data.success
    } catch (error) {
      console.error('Send code error:', error)
      // 如果是404，可能是路由问题，尝试直接返回成功（开发模式）
      if (error.response?.status === 404) {
        console.warn('路由未找到，请检查后端服务是否正常运行')
      }
      throw error
    }
  }

  async function fetchUser() {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        user.value = response.data.data
        return true
      }
      return false
    } catch (error) {
      console.error('Fetch user error:', error)
      token.value = ''
      localStorage.removeItem('token')
      return false
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    sendCode,
    fetchUser,
    logout
  }
})


import axios from 'axios'
import { clearSessionMeta } from '../auth/session'

const API_BASE_URL = import.meta.env.API_BASE_URL || 'https://api-check-tool.travellings.cn/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 这两页不跳转：登录页本身无需跳；过渡页会自行处理 /auth/me 失败，抢跳会冲掉它的错误提示。
const NO_REDIRECT_PATHS = ['/login', '/auth-transition']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      clearSessionMeta()
      const { pathname, search } = window.location
      if (!NO_REDIRECT_PATHS.includes(pathname)) {
        window.location.href = `/login?reason=expired&redirect=${encodeURIComponent(pathname + search)}`
      }
    }
    return Promise.reject(error)
  }
)

// 后端业务失败时仍返回 HTTP 200，只在响应体里给 success:false，必须显式判断。
export class ApiError extends Error {
  constructor(message, body) {
    super(message)
    this.name = 'ApiError'
    this.body = body
  }
}

export async function call(promise) {
  const response = await promise
  const body = response.data
  if (!body?.success) {
    throw new ApiError(body?.msg || '请求失败', body)
  }
  return body
}

// 列表接口的数据位置不统一：多数放 data；/CheckError 放 msg；列表为空时 msg 是一句提示文本。
export function listOf(body) {
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.msg)) return body.msg
  return []
}

const MESSAGE_ZH = {
  'Permission Needed': '没有权限执行该操作',
  'Have not logged in': '登录状态已失效，请重新登录',
  'unable to search the site data': '站点不存在',
  'Repeated sites': '该站点已在误报列表中',
  'Unable to fetch data': '数据获取失败',
  'Unable to update data': '数据更新失败',
  'Invalid request': '请求参数有误',
  'Invalid log id': '日志 ID 无效',
  'Internal error': '服务器内部错误'
}

export function errorMessage(error, fallback = '请求失败') {
  const raw = error?.response?.data?.msg ?? (error instanceof ApiError ? error.message : null)
  if (typeof raw === 'string' && raw) return MESSAGE_ZH[raw] || raw
  if (error?.code === 'ECONNABORTED') return '请求超时，请稍后再试'
  return fallback
}

export default api

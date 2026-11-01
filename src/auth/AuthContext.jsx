import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { clearSessionMeta, ensureSessionExpiresAt, stampSessionExpiresAt } from './session'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.API_BASE_URL || 'https://api-check-tool.travellings.cn/api'

function safeParseUser() {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// 只接受站内绝对路径：拒绝 //evil.com、/\\evil.com 这类协议相对地址，避免开放重定向。
function toSafeRedirect(value) {
  if (typeof value !== 'string' || !value) return '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => safeParseUser())
  const [loading, setLoading] = useState(false)

  const isAuthenticated = Boolean(token)
  const isAdmin = user?.role === 1

  const clearLocalSession = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearSessionMeta()
  }, [])

  // 先 fire-and-forget 通知后端注销，再清本地状态。
  // 必须显式带上 Authorization：调用后立刻清掉 localStorage，等到 axios 请求拦截器执行时已取不到 token。
  // 无 token 时跳过请求，否则后端 401 会触发 client.js 的全局跳转，把带 reason 的登出过渡页冲掉。
  const logout = useCallback(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      api
        .post('/auth/logout', null, { headers: { Authorization: `Bearer ${storedToken}` } })
        .catch(() => {})
    }
    clearLocalSession()
  }, [clearLocalSession])

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data?.success && response.data.data) {
        setUser(response.data.data)
        localStorage.setItem('user', JSON.stringify(response.data.data))
        return true
      }
      logout()
      return false
    } catch {
      logout()
      return false
    }
  }, [logout])

  // GitHub SSO 由后端完成 OAuth 全过程，前端只负责整页跳转发起。
  const startGithubLogin = useCallback((redirect = '/') => {
    const target = toSafeRedirect(redirect)
    window.location.assign(API_BASE + '/auth/github/login?redirect=' + encodeURIComponent(target))
  }, [])

  // 接收后端 302 回来的不透明 token：落库 + 计时 + 拉取用户信息。
  const acceptToken = useCallback(async (rawToken) => {
    const nextToken = typeof rawToken === 'string' ? rawToken.trim() : ''
    if (!nextToken) return false

    setToken(nextToken)
    localStorage.setItem('token', nextToken)
    stampSessionExpiresAt(nextToken)

    return await fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (token) ensureSessionExpiresAt(token)
  }, [token])

  useEffect(() => {
    async function bootstrap() {
      if (!token || user) return
      setLoading(true)
      await fetchUser()
      setLoading(false)
    }

    bootstrap()
  }, [token, user, fetchUser])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated,
      isAdmin,
      startGithubLogin,
      acceptToken,
      fetchUser,
      logout
    }),
    [token, user, loading, isAuthenticated, isAdmin, startGithubLogin, acceptToken, fetchUser, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

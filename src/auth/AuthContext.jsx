import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { clearSessionMeta, ensureSessionExpiresAt, stampSessionExpiresAt } from './session'

const AuthContext = createContext(null)

function safeParseUser() {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
    const turnstileVerifyMode = import.meta.env.TURNSTILE_VERIFY_MODE || 'frontend'

    function appendTurnstilePayload(payload, turnstileToken, verifyMode) {
      if ((verifyMode || turnstileVerifyMode) !== 'backend') return payload
      if (!turnstileToken) return payload
      return {
        ...payload,
        turnstileToken,
        'cf-turnstile-response': turnstileToken
      }
    }

  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => safeParseUser())
  const [loading, setLoading] = useState(false)

  const isAuthenticated = Boolean(token)
  const isAdmin = user?.role === 1

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearSessionMeta()
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data?.success) {
        setUser(response.data.data)
        localStorage.setItem('user', JSON.stringify(response.data.data))
        return true
      }
      return false
    } catch {
      logout()
      return false
    }
  }, [logout])

  const login = useCallback(async (email, password, code, options = {}) => {
    const payload = appendTurnstilePayload({
      email,
      password,
      code
    }, options.turnstileToken, options.verifyMode)

    const response = await api.post('/auth/login', payload)

    if (response.data?.success) {
      const payload = response.data.data
      setToken(payload.token)
      setUser(payload.user)
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))
      stampSessionExpiresAt(payload.token)
      return true
    }

    return false
  }, [])

  const sendCode = useCallback(async (email, options = {}) => {
    const payload = appendTurnstilePayload({ email }, options.turnstileToken, options.verifyMode)
    const response = await api.post('/auth/send-code', payload)
    return Boolean(response.data?.success)
  }, [])

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
      login,
      sendCode,
      fetchUser,
      logout
    }),
    [token, user, loading, isAuthenticated, isAdmin, login, sendCode, fetchUser, logout]
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

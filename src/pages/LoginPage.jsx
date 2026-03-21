import { Alert, Box, Button, Card, CardContent, Snackbar, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import TurnstileDialog from '../components/TurnstileDialog'

function LoginPage() {
  const { login, sendCode, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loginMode, setLoginMode] = useState('password')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [turnstileOpen, setTurnstileOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [turnstileSession, setTurnstileSession] = useState(0)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const [navigatingByLogin, setNavigatingByLogin] = useState(false)

  const redirect = new URLSearchParams(location.search).get('redirect') || '/'
  const turnstileEnabledRaw = import.meta.env.TURNSTILE_ENABLED
  const turnstileSiteKey = import.meta.env.TURNSTILE_SITE_KEY || ''
  const turnstileVerifyMode = import.meta.env.TURNSTILE_VERIFY_MODE || 'frontend'
  const turnstileEnabled = turnstileEnabledRaw !== 'false'
  const turnstileReady = turnstileEnabled && Boolean(turnstileSiteKey)

  useEffect(() => {
    if (isAuthenticated && !navigatingByLogin) {
      navigate(redirect, { replace: true })
    }
  }, [isAuthenticated, navigatingByLogin, navigate, redirect])

  useEffect(() => {
    if (!countdown) return
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  async function doSendCode(turnstileToken) {
    if (!email) {
      setError('请先输入邮箱。')
      return
    }

    setSendingCode(true)
    setError('')
    try {
      await sendCode(email, {
        turnstileToken,
        verifyMode: turnstileVerifyMode
      })
      setCountdown(60)
      setToast({ open: true, message: '验证码已发送，请注意查收。', severity: 'success' })
    } catch (err) {
      const msg = err.response?.data?.msg || '验证码发送失败，请稍后重试。'
      setError(msg)
      setToast({ open: true, message: msg, severity: 'error' })
    } finally {
      setSendingCode(false)
    }
  }

  async function handleSendCode() {
    if (turnstileEnabled) {
      if (!turnstileReady) {
        const msg = '未配置 Turnstile Site Key，请先设置 TURNSTILE_SITE_KEY。'
        setError(msg)
        setToast({ open: true, message: msg, severity: 'error' })
        return
      }
      setPendingAction('send-code')
      setTurnstileSession((value) => value + 1)
      setTurnstileOpen(true)
      return
    }
    doSendCode()
  }

  async function doLogin(turnstileToken) {
    setSubmitting(true)
    setError('')

    try {
      const success = await login(email, useCode ? null : password, useCode ? code : null, {
        turnstileToken,
        verifyMode: turnstileVerifyMode
      })
      if (success) {
        setNavigatingByLogin(true)
        navigate(`/auth-transition?type=login&redirect=${encodeURIComponent(redirect)}`, { replace: true })
      } else {
        setError('登录失败，请检查账号信息。')
      }
    } catch (err) {
      setError(err.response?.data?.msg || '登录失败，请稍后再试。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    doLogin()
  }

  function handleTurnstileVerified(token) {
    setTurnstileOpen(false)
    if (pendingAction === 'login') {
      doLogin(token)
    } else if (pendingAction === 'send-code') {
      doSendCode(token)
    }
    setPendingAction(null)
  }

  const useCode = loginMode === 'code'

  return (
    <Box className="mx-auto flex min-h-screen w-full max-w-[1100px] items-center px-4 py-8 sm:px-6">
      <Box className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Box className="hidden rounded-3xl bg-gradient-to-br from-[#A2CCCE] via-[#b8d5d6] to-[#CEB0A1] p-8 text-white shadow-xl lg:block">
          <Box
            component="img"
            src="/icon.webp"
            alt="Travellings Check-Tool"
            className="mb-5 h-16 w-16 rounded-2xl border border-white/30 bg-black/20 p-1"
          />
          <Typography variant="h3" className="font-bold leading-tight">
            Travellings
            <br />
            Check-Tool
          </Typography>
          <Typography variant="h6" className="mt-4 text-white/90">
            开往巡查工具
          </Typography>
        </Box>

        <Card className="rounded-3xl bg-white/90 shadow-lg backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <Typography variant="h5" className="font-semibold text-slate-900">
              登录系统
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              使用密码或验证码登录。
            </Typography>

            <ToggleButtonGroup
              exclusive
              value={loginMode}
              onChange={(_, nextMode) => {
                if (nextMode) setLoginMode(nextMode)
              }}
              size="small"
              fullWidth
              className="mt-4"
            >
              <ToggleButton value="password">密码登录</ToggleButton>
              <ToggleButton value="code">验证码登录</ToggleButton>
            </ToggleButtonGroup>

            <Box component="form" className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              {!useCode ? (
                <TextField
                  fullWidth
                  label="密码"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              ) : (
                <Box className="flex items-start gap-2">
                  <TextField
                    fullWidth
                    label="验证码"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0 || !email}
                    className="min-h-14 min-w-28 whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s 后可重发` : '发送验证码'}
                  </Button>
                </Box>
              )}

              {error ? <Alert severity="error">{error}</Alert> : null}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting || !email || (!useCode && !password) || (useCode && !code)}
                className="h-11"
              >
                {submitting ? '登录中...' : '登录'}
              </Button>

            </Box>
          </CardContent>
        </Card>
      </Box>

      <TurnstileDialog
        key={turnstileSession}
        open={turnstileOpen}
        siteKey={turnstileSiteKey}
        action={pendingAction === 'send-code' ? 'send_code' : 'login'}
        onVerified={handleTurnstileVerified}
        onCancel={() => {
          setTurnstileOpen(false)
          setPendingAction(null)
        }}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LoginPage

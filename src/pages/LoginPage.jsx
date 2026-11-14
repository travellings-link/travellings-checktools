import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const SESSION_END_MESSAGES = {
  idle: '因长时间无操作，会话已自动登出。',
  expired: '登录状态已过期，请重新登录。',
  'other-tab': '账号已在其他标签页登出。'
}

const OAUTH_ERROR_MESSAGES = {
  state_mismatch: '登录状态校验失败，请重新登录。',
  oauth_failed: 'GitHub 授权失败，请重试。',
  github_denied: '你已取消 GitHub 授权。'
}

// 只接受站内绝对路径：拒绝 //evil.com、/\\evil.com 这类协议相对地址，避免开放重定向。
function toSafeRedirect(value) {
  if (typeof value !== 'string' || !value) return '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}

function LoginPage() {
  const { startGithubLogin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const redirect = toSafeRedirect(searchParams.get('redirect'))
  const reason = searchParams.get('reason') || ''
  const oauthError = searchParams.get('error') || ''
  const errorMessage = oauthError ? OAUTH_ERROR_MESSAGES[oauthError] || '登录失败，请重试。' : ''

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect, { replace: true })
    }
  }, [isAuthenticated, navigate, redirect])

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
              使用 GitHub 账号登录。
            </Typography>

            {SESSION_END_MESSAGES[reason] ? (
              <Alert severity="info" className="mt-4">
                {SESSION_END_MESSAGES[reason]}
              </Alert>
            ) : null}

            {errorMessage ? (
              <Alert severity="error" className="mt-4">
                {errorMessage}
              </Alert>
            ) : null}

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<GitHubIcon />}
              className="mt-6 h-11"
              onClick={() => startGithubLogin(redirect)}
            >
              使用 GitHub 登录
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default LoginPage

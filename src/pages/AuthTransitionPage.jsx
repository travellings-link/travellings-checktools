import { Alert, Box, Fade, LinearProgress, Typography } from '@mui/material'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function AuthTransitionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [error, setError] = useState('')

  const type = searchParams.get('type')
  const reason = searchParams.get('reason')
  const redirect = useMemo(() => searchParams.get('redirect') || '/', [searchParams])

  useEffect(() => {
    let timer

    async function runTransition() {
      if (type === 'logout') {
        logout()
        timer = window.setTimeout(() => {
          navigate(reason ? `/login?reason=${reason}` : '/login', { replace: true })
        }, 900)
        return
      }

      if (type === 'login') {
        timer = window.setTimeout(() => {
          navigate(redirect, { replace: true })
        }, 900)
        return
      }

      setError('无效的认证过渡参数。')
      timer = window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    }

    runTransition()

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [type, reason, redirect, navigate, logout])

  return (
    <Box className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Fade in timeout={260}>
      <Box
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur"
        sx={{
          animation: 'authPop 360ms ease-out'
        }}
      >
        <Box className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" sx={{ bgcolor: '#f2ece8', color: '#A2CCCE' }}>
          {type === 'logout' ? <LogoutRoundedIcon /> : <LoginRoundedIcon />}
        </Box>
        <Typography variant="h6" className="mt-5 font-semibold">
          {type === 'logout' ? '正在安全退出...' : '登录成功，正在进入系统...'}
        </Typography>
        <Typography color="text.secondary" className="mt-1">
          请稍候，正在完成会话切换。
        </Typography>
        <LinearProgress className="mt-5" />
        {error ? (
          <Alert severity="error" className="mt-4 text-left">
            {error}
          </Alert>
        ) : null}
      </Box>
      </Fade>
      <style>{`@keyframes authPop { from { transform: translateY(10px) scale(.98); opacity: .2; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
    </Box>
  )
}

export default AuthTransitionPage

import { Alert, Box, Fade, LinearProgress, Typography } from '@mui/material'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

// 后端把 token 放在 URL fragment 里（#token=xxx），fragment 不会发送到服务器；可能还带其它参数。
function readTokenFromHash(hash) {
  if (!hash) return ''
  const raw = hash.replace(/^#/, '').replace(/^\?/, '')
  if (!raw) return ''
  return new URLSearchParams(raw).get('token') || ''
}

// 只接受站内绝对路径：拒绝 //evil.com、/\\evil.com 这类协议相对地址，避免开放重定向。
function toSafeRedirect(value) {
  if (typeof value !== 'string' || !value) return '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}

function AuthTransitionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout, acceptToken } = useAuth()
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  const type = searchParams.get('type')
  const reason = searchParams.get('reason')
  const redirect = useMemo(() => toSafeRedirect(searchParams.get('redirect')), [searchParams])

  useEffect(() => {
    // StrictMode 下 effect 会跑两遍，第二遍 fragment 已被消费会误判成失败，这里只放行第一次。
    if (startedRef.current) return
    startedRef.current = true

    // 不做 cleanup 取消：StrictMode 的首次清理会早于异步 token 校验完成，
    // 若在此取消定时器，第二次 effect 又被幂等保护跳过，开发态会永远卡在过渡页。
    // 本页是一次性过渡页，完成跳转即其唯一职责。

    async function runTransition() {
      if (type === 'logout') {
        logout()
        window.setTimeout(() => {
          navigate(reason ? `/login?reason=${reason}` : '/login', { replace: true })
        }, 900)
        return
      }

      if (type === 'login') {
        const incomingToken = readTokenFromHash(window.location.hash)

        if (!incomingToken) {
          setError('登录凭证无效，请重新登录。')
          window.setTimeout(() => {
            navigate('/login?error=oauth_failed', { replace: true })
          }, 1200)
          return
        }

        const accepted = await acceptToken(incomingToken)

        if (!accepted) {
          setError('登录凭证无效，请重新登录。')
          window.setTimeout(() => {
            navigate('/login?error=oauth_failed', { replace: true })
          }, 1200)
          return
        }

        // token 已落库，立刻把 fragment 从地址栏和浏览器历史里抹掉，避免凭证残留。
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        window.setTimeout(() => {
          navigate(redirect, { replace: true })
        }, 900)
        return
      }

      setError('无效的认证过渡参数。')
      window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    }

    runTransition()
  }, [type, reason, redirect, navigate, logout, acceptToken])

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
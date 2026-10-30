import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IDLE_LIMIT_MS,
  WARN_BEFORE_MS,
  hasStoredToken,
  readLastActivity,
  readSessionExpiresAt,
  touchActivity
} from '../auth/session'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']
const TICK_MS = 1000

function SessionGuard() {
  const navigate = useNavigate()
  const [warning, setWarning] = useState(null)
  const warningRef = useRef(null)
  const lastWarningRef = useRef(null)

  // 经由 auth-transition 登出：直接调 logout() 会让 RequireAuth 在同一次提交里渲染
  // 自己的 Navigate，把带 reason 的跳转覆盖掉；该路由在 RequireAuth 之外，无此竞态。
  const endSession = useCallback(
    (reason) => navigate(`/auth-transition?type=logout&reason=${reason}`, { replace: true }),
    [navigate]
  )

  // navigate 的身份会随路由变化，放进 ref 以免每次跳转都重挂监听器。
  const endSessionRef = useRef(endSession)
  endSessionRef.current = endSession

  useEffect(() => {
    touchActivity(true)

    const onActivity = () => touchActivity()
    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true, capture: true })
    )

    const timer = window.setInterval(() => {
      const now = Date.now()
      const expiresAt = readSessionExpiresAt()
      const idleDeadline = (readLastActivity() ?? now) + IDLE_LIMIT_MS
      const hardDeadline = expiresAt ?? Infinity

      if (now >= hardDeadline) {
        endSessionRef.current('expired')
        return
      }
      if (now >= idleDeadline) {
        endSessionRef.current('idle')
        return
      }

      const deadline = Math.min(hardDeadline, idleDeadline)
      const next =
        deadline - now <= WARN_BEFORE_MS
          ? { kind: hardDeadline <= idleDeadline ? 'expired' : 'idle', remaining: Math.ceil((deadline - now) / 1000) }
          : null

      const prev = warningRef.current
      if (next === null) {
        if (prev !== null) {
          warningRef.current = null
          setWarning(null)
        }
      } else if (!prev || prev.kind !== next.kind || prev.remaining !== next.remaining) {
        warningRef.current = next
        setWarning(next)
      }
    }, TICK_MS)

    // 其他标签页登出后本页 React 状态仍认为已登录，必须显式同步。
    const onStorage = (event) => {
      if (event.key === 'token' && event.newValue === null && !hasStoredToken()) {
        endSessionRef.current('other-tab')
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', onStorage)
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity, { capture: true }))
    }
  }, [warningRef])

  const stay = useCallback(() => {
    touchActivity(true)
    warningRef.current = null
    setWarning(null)
  }, [warningRef])

  // Dialog 退场动画期间 warning 已为 null，需沿用上一次的文案，否则会闪成另一种超时类型。
  if (warning) lastWarningRef.current = warning
  const view = warning ?? lastWarningRef.current
  const isIdle = view?.kind === 'idle'

  return (
    <Dialog open={Boolean(warning)} maxWidth="xs" fullWidth>
      <DialogTitle>{isIdle ? '会话即将超时' : '登录状态即将过期'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {isIdle
            ? `已检测到 ${Math.round(IDLE_LIMIT_MS / 60000)} 分钟无操作，${view?.remaining ?? 0} 秒后将自动登出。`
            : `登录凭证已到达有效期上限，${view?.remaining ?? 0} 秒后需要重新登录，请尽快提交未保存的巡查内容。`}
        </Typography>
      </DialogContent>
      <DialogActions>
        {isIdle ? <Button onClick={stay}>继续停留</Button> : null}
        <Button variant="contained" onClick={() => endSession(isIdle ? 'idle' : 'expired')}>
          {isIdle ? '立即登出' : '重新登录'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SessionGuard

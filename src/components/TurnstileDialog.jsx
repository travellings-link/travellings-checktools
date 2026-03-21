import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function TurnstileDialog({ open, siteKey, action, onVerified, onCancel }) {
  const widgetContainerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [error, setError] = useState('')

  const canRender = useMemo(() => open && Boolean(siteKey), [open, siteKey])

  useEffect(() => {
    if (!open) return

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID)
    if (existingScript) {
      if (window.turnstile) setScriptReady(true)
      else {
        existingScript.addEventListener('load', () => setScriptReady(true), { once: true })
      }
      return
    }

    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => setScriptReady(true)
    script.onerror = () => setError('Turnstile 脚本加载失败，请检查网络或站点配置。')
    document.head.appendChild(script)
  }, [open])

  useEffect(() => {
    if (!canRender || !scriptReady || !window.turnstile || !widgetContainerRef.current) return

    setError('')

    if (widgetIdRef.current !== null) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }

    widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
      sitekey: siteKey,
      action,
      appearance: 'always',
      callback: (token) => {
        onVerified(token)
      },
      'expired-callback': () => {
        setError('验证已过期，请重试。')
      },
      'error-callback': () => {
        setError('验证失败，请稍后重试。')
      }
    })
  }, [canRender, scriptReady, siteKey, action, onVerified])

  useEffect(() => {
    if (!open && widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>人机验证</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" className="mb-3">
          请先完成 Cloudflare Turnstile 验证。
        </Typography>
        {!siteKey ? (
          <Alert severity="warning">未配置 TURNSTILE_SITE_KEY，无法启用人机验证。</Alert>
        ) : null}
        {siteKey && !scriptReady ? (
          <Box className="flex min-h-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary" className="ml-2">
              正在加载验证码...
            </Typography>
          </Box>
        ) : null}
        <Box ref={widgetContainerRef} className="min-h-20 rounded-xl border border-slate-200 p-3" />
        {error ? <Alert severity="error" className="mt-3">{error}</Alert> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>取消</Button>
      </DialogActions>
    </Dialog>
  )
}

export default TurnstileDialog

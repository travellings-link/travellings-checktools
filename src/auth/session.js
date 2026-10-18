const TOKEN_KEY = 'token'
const SESSION_EXPIRES_KEY = 'sessionExpiresAt'
const LAST_ACTIVITY_KEY = 'lastActivity'

export const IDLE_LIMIT_MS = 30 * 60 * 1000
export const WARN_BEFORE_MS = 60 * 1000
export const MAX_SESSION_MS = 12 * 60 * 60 * 1000

const ACTIVITY_THROTTLE_MS = 5 * 1000

let lastActivityWrite = 0

// 只解码不验签：这里仅用于前端计时，token 是否有效始终由后端判定。
function decodeJwtExp(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

function resolveExpiresAt(token, issuedAt) {
  const exp = decodeJwtExp(token)
  if (exp !== null) return exp * 1000
  return issuedAt + MAX_SESSION_MS
}

function readNumber(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export function stampSessionExpiresAt(token) {
  localStorage.setItem(SESSION_EXPIRES_KEY, String(resolveExpiresAt(token, Date.now())))
}

// 本次特性上线前签发的 token 没有时间戳，首次加载时补一个，避免刷新即被登出。
export function ensureSessionExpiresAt(token) {
  if (readNumber(SESSION_EXPIRES_KEY) === null) stampSessionExpiresAt(token)
}

export function readSessionExpiresAt() {
  return readNumber(SESSION_EXPIRES_KEY)
}

export function readLastActivity() {
  return readNumber(LAST_ACTIVITY_KEY)
}

export function touchActivity(force = false) {
  const now = Date.now()
  if (!force && now - lastActivityWrite < ACTIVITY_THROTTLE_MS) return
  lastActivityWrite = now
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
}

export function clearSessionMeta() {
  localStorage.removeItem(SESSION_EXPIRES_KEY)
  localStorage.removeItem(LAST_ACTIVITY_KEY)
  lastActivityWrite = 0
}

export function hasStoredToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

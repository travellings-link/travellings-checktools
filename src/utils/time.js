// 后端时间是 'yyyy-MM-dd HH:mm:ss' 字符串（按 app.time-zone=Asia/Shanghai 生成，不带时区）。
// Safari 解析不了中间是空格的写法，这里显式补成 ISO 并带上 +08:00。
const BACKEND_TIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/

export function parseBackendTime(value) {
  if (!value) return null
  const match = BACKEND_TIME.exec(String(value).trim())
  const date = match ? new Date(`${match[1]}T${match[2]}+08:00`) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatTime(value, empty = '—') {
  const date = parseBackendTime(value)
  if (!date) return value || empty
  return date.toLocaleString('zh-CN', { hour12: false })
}

import axios from 'axios'

const DEFAULT_BASE_URL = import.meta.env.DEV ? '/travellings-api' : 'https://api.travellings.cn'
const BASE_URL = (import.meta.env.API_TRAVELLINGS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
const AUTH_BASE_URL = import.meta.env.API_TRAVELLINGS_AUTH_BASE_URL || 'https://api.travellings.cn'
const GO_TAG = 'go'
const MAX_RANDOM_ATTEMPTS = 5

export const SITE_STATUS_OPTIONS = [
  { value: 'RUN', label: '正常' },
  { value: 'LOST', label: '存活但无往链标识' },
  { value: 'ERROR', label: '网站异常' },
  { value: 'TIMEOUT', label: '连接超时' },
  { value: 'WAIT', label: '等待处理' },
  ...[400, 403, 404, 405, 418, 429, 500, 501, 502, 503, 504].map((code) => ({
    value: String(code),
    label: String(code)
  }))
]

export const QUICK_TAG_OPTIONS = ['go', 'blog', 'tech']

const travellingsApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true
})

export class TravellingsApiError extends Error {
  constructor(message, body) {
    super(message)
    this.name = 'TravellingsApiError'
    this.body = body
  }
}

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new TravellingsApiError(body?.msg || 'Travellings API 请求失败', body)
  }
  return body
}

export function normalizeTags(value) {
  return [...new Set(String(value ?? '').split(',').map((tag) => tag.trim()).filter(Boolean))].join(',')
}

export function hasTag(value, expectedTag) {
  return normalizeTags(value).split(',').includes(expectedTag)
}

export function safeSiteUrl(value) {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new TravellingsApiError('站点链接不是安全的 HTTP(S) 地址')
  }
  return url.href
}

// 规则修订专题（倒查）用：拉取上游全量站点并按目标状态集过滤。
// 上游 /all 单次返回全量（当前约 1675 条），因此不需要分页。
// include 为 true 时只保留 status 属于 statuses 的；默认 false 表示「排除这些状态」。
export async function fetchReviewSites({ statuses = ['RUN'], include = false } = {}) {
  const body = unwrap(await travellingsApi.get('/all'))
  const sites = Array.isArray(body.data) ? body.data : []
  const wanted = new Set(statuses)
  return sites.filter((site) => {
    const matched = wanted.has(site?.status)
    return include ? matched : !matched
  })
}

export async function fetchRandomGoSite() {
  for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS; attempt += 1) {
    const body = unwrap(await travellingsApi.get('/random', { params: { tag: GO_TAG } }))
    const site = Array.isArray(body.data) ? body.data[0] : null

    if (!site || site.id === undefined || site.id === null) {
      throw new TravellingsApiError('随机巡查接口没有返回站点')
    }

    if (hasTag(site.tag, GO_TAG)) {
      return { ...site, url: safeSiteUrl(site.url) }
    }
  }

  throw new TravellingsApiError('随机接口连续返回了不含 go 标签的站点，请稍后重试')
}

export async function updateSiteInspection(id, { tag, status }) {
  const normalizedTag = normalizeTags(tag)
  if (!normalizedTag) {
    throw new TravellingsApiError('Tag 不能为空；当前 API 不支持清空 Tag')
  }
  if (!SITE_STATUS_OPTIONS.some((option) => option.value === status)) {
    throw new TravellingsApiError('请选择有效的站点状态')
  }

  const body = unwrap(await travellingsApi.post('/action/edit', { id, tag: normalizedTag, status }))
  return body.data?.updatedWeb || { id, tag: normalizedTag, status }
}


export function travellingsErrorMessage(error, fallback = '请求失败') {
  if (error instanceof TravellingsApiError) return error.message
  if (error?.response?.data?.msg) return error.response.data.msg
  if (error?.code === 'ECONNABORTED') return '请求超时，请稍后重试'
  return fallback
}

export function getTravellingsLoginUrl() {
  const loginUrl = new URL('/login/github', AUTH_BASE_URL)
  loginUrl.searchParams.set('redirect_url', window.location.href)
  return loginUrl.href
}

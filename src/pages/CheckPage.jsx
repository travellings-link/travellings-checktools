import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
import { useCallback, useState } from 'react'
import {
  fetchRandomGoSite,
  getTravellingsLoginUrl,
  QUICK_TAG_OPTIONS,
  SITE_STATUS_OPTIONS,
  normalizeTags,
  safeSiteUrl,
  travellingsErrorMessage,
  updateSiteInspection
} from '../api/travellings'

function CheckPage() {
  const [currentSite, setCurrentSite] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [statusInput, setStatusInput] = useState('RUN')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const startRandomCheck = useCallback(async () => {
    if (loading || saving) return

    const inspectionWindow = window.open('about:blank', '_blank')
    if (inspectionWindow) {
      inspectionWindow.opener = null
      inspectionWindow.document.title = '正在获取随机巡查站点…'
      inspectionWindow.document.body.textContent = '正在获取随机巡查站点…'
    }

    setLoading(true)
    try {
      const site = await fetchRandomGoSite()
      setCurrentSite(site)
      setTagInput(normalizeTags(site.tag))
      setStatusInput(site.status || 'RUN')

      if (inspectionWindow) {
        inspectionWindow.location.replace(site.url)
      } else {
        showToast('浏览器拦截了新窗口，请点击站点链接打开', 'warning')
      }
    } catch (error) {
      inspectionWindow?.close()
      showToast(travellingsErrorMessage(error, '获取随机站点失败'), 'error')
    } finally {
      setLoading(false)
    }
  }, [loading, saving, showToast])

  const toggleQuickTag = useCallback((tag) => {
    setTagInput((value) => {
      const tags = normalizeTags(value).split(',').filter(Boolean)
      return tags.includes(tag) ? tags.filter((item) => item !== tag).join(',') : normalizeTags([...tags, tag].join(','))
    })
  }, [])

  const saveInspection = useCallback(async () => {
    if (!currentSite || saving) return

    const normalizedTag = normalizeTags(tagInput)
    if (!normalizedTag) {
      showToast('Tag 不能为空；当前 API 不支持清空 Tag', 'warning')
      return
    }

    setSaving(true)
    try {
      const requestedId = currentSite.id
      const updatedSite = await updateSiteInspection(requestedId, { tag: normalizedTag, status: statusInput })
      const updatedTag = normalizeTags(updatedSite.tag ?? normalizedTag)
      setCurrentSite((site) => {
        if (site?.id !== requestedId) return site
        return { ...site, ...updatedSite, url: site.url, tag: updatedTag, status: updatedSite.status || statusInput }
      })
      setTagInput(updatedTag)
      setStatusInput(updatedSite.status || statusInput)
      showToast('状态与 Tag 修改成功')
    } catch (error) {
      showToast(travellingsErrorMessage(error, '状态与 Tag 修改失败'), 'error')
    } finally {
      setSaving(false)
    }
  }, [currentSite, saving, showToast, statusInput, tagInput])

  const safeCurrentUrl = (() => {
    try {
      return currentSite ? safeSiteUrl(currentSite.url) : null
    } catch {
      return null
    }
  })()

  return (
    <Box className="mx-auto max-w-4xl">
      <Box className="flex flex-wrap items-end justify-between gap-3">
        <Box>
          <Typography variant="h4" className="font-semibold text-slate-900">
            网站巡查
          </Typography>
          <Typography color="text.secondary" className="mt-1">
            随机抽取带 go 标签的站点；发现标签不准确时可直接修改。
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ShuffleRoundedIcon />}
          onClick={startRandomCheck}
          disabled={loading || saving}
        >
          {currentSite ? '换一个并打开' : '随机巡查并打开'}
        </Button>
      </Box>

      <Alert severity="info" className="mt-5">
        随机接口固定请求 <code>tag=go</code>，并在前端再次校验 go 是完整标签，避免匹配到包含相同字符的其他 Tag。
      </Alert>

      {!currentSite ? (
        <Card className="mt-5 rounded-2xl">
          <CardContent className="py-10 text-center">
            <ShuffleRoundedIcon color="action" sx={{ fontSize: 48 }} />
            <Typography variant="h6" className="mt-2">
              尚未抽取巡查站点
            </Typography>
            <Typography color="text.secondary" className="mt-1">
              点击“随机巡查并打开”，站点将在新窗口中打开。
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-5 rounded-2xl">
          <CardContent>
            <Box className="flex flex-wrap items-start justify-between gap-3">
              <Box className="min-w-0">
                <Typography variant="h5" className="font-semibold">
                  {currentSite.name || '未命名站点'}
                </Typography>
                {safeCurrentUrl ? (
                  <Link
                    href={safeCurrentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 break-all"
                  >
                    {safeCurrentUrl}
                    <OpenInNewRoundedIcon fontSize="small" />
                  </Link>
                ) : (
                  <Typography color="error" className="mt-1">
                    站点链接无效，已禁止打开
                  </Typography>
                )}
              </Box>
              <Chip label={`ID ${currentSite.id}`} size="small" />
            </Box>

            <Box className="mt-6 border-t border-slate-200 pt-5">
              <Box className="mb-3 flex items-center gap-2">
                <EditRoundedIcon color="action" />
                <Typography variant="h6">修改状态与 Tag</Typography>
              </Box>
              <Typography variant="subtitle2" className="mb-2">状态快捷选择</Typography>
              <Box className="mb-5 flex flex-wrap gap-2" role="group" aria-label="状态快捷选择">
                {SITE_STATUS_OPTIONS.map((option) => (
                  <Tooltip key={option.value} title={option.label === option.value ? '' : option.label}>
                    <Chip
                      label={option.value}
                      color={statusInput === option.value ? 'primary' : 'default'}
                      variant={statusInput === option.value ? 'filled' : 'outlined'}
                      onClick={() => setStatusInput(option.value)}
                      disabled={saving}
                      clickable
                    />
                  </Tooltip>
                ))}
              </Box>

              <Typography variant="subtitle2" className="mb-2">Tag 快捷选择</Typography>
              <Box className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Tag 快捷选择">
                {QUICK_TAG_OPTIONS.map((tag) => {
                  const selected = normalizeTags(tagInput).split(',').includes(tag)
                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      color={selected ? 'secondary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      onClick={() => toggleQuickTag(tag)}
                      disabled={saving}
                      clickable
                    />
                  )
                })}
              </Box>
              <TextField
                fullWidth
                label="Tag"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                disabled={saving}
                helperText="多个 Tag 使用英文逗号分隔；空白与重复项会自动清理。"
                placeholder="go,blog,tech"
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') saveInspection()
                }}
              />
              <Box className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="contained" onClick={saveInspection} disabled={saving || !tagInput.trim()}>
                  {saving ? '保存中…' : '保存修改'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  快捷键：Ctrl/⌘ + Enter
                </Typography>
              </Box>
              <Alert severity="warning" className="mt-4">
                修改接口使用 Travellings API 的 <code>_tlogin</code> 管理员 Cookie，而不是本工具的 Bearer Token。{' '}
                {import.meta.env.DEV ? (
                  <>
                    本地开发地址无法接收属于 <code>.travellings.cn</code> 的 HttpOnly Cookie，因此本地只能验证随机巡查；请在
                    Travellings 正式子域部署后测试修改状态与 Tag。
                  </>
                ) : (
                  <>
                    若提示缺少 Token 或无权限，请先{' '}
                    <Link href={getTravellingsLoginUrl()} target="_blank" rel="noopener noreferrer">
                      登录 Travellings API
                    </Link>
                    ，并确认账号在该 API 中的角色为管理员。
                  </>
                )}
              </Alert>
            </Box>
          </CardContent>
        </Card>
      )}

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((value) => ({ ...value, open: false }))}>
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((value) => ({ ...value, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CheckPage

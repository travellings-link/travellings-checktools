import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { errorMessage } from '../api/client'
import {
  fetchRemovalMarks,
  markRemoval,
  NON_RUN_REMOVAL_REASONS,
  OTHER_REASON
} from '../api/nonRunRemovals'
import { fetchReviewSites, safeSiteUrl, SITE_STATUS_OPTIONS } from '../api/travellings'

// 专题基准日：页面核对的「成员列表」以这一天为准，公示里也要写清口径。
const SNAPSHOT_DATE = '2026-11-28'
const STATUS_LABEL = new Map(SITE_STATUS_OPTIONS.map((option) => [option.value, option.label]))

function statusLabel(status) {
  const label = STATUS_LABEL.get(status)
  return label && label !== status ? status + '（' + label + '）' : status || '—'
}

function toCsv(rows) {
  const header = ['站点ID', '站点名称', '网址', '状态', '删除原因', '补充说明', '操作人', '标记时间']
  const cell = (value) => {
    let text = String(value ?? '')
    // 防 CSV 公式注入：Excel 会把 = + - @ 开头的单元格当公式执行
    if (/^[=+\-@]/.test(text)) text = "'" + text
    return '"' + text.replace(/"/g, '""') + '"'
  }
  const lines = [header, ...rows.map((row) => [row.siteId, row.name, row.url, row.status, row.reason, row.detail, row.operator, row.createdAt])]
  return '\ufeff' + lines.map((line) => line.map(cell).join(',')).join('\r\n')
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '非RUN站点待删除台账_' + SNAPSHOT_DATE + '.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function NonRunReviewPage() {
  const [sites, setSites] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [target, setTarget] = useState(null)
  const [reason, setReason] = useState(NON_RUN_REMOVAL_REASONS[0])
  const [detail, setDetail] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [siteList, markList] = await Promise.all([fetchReviewSites(), fetchRemovalMarks()])
      setSites(siteList)
      setMarks(markList)
    } catch (error) {
      showToast(errorMessage(error, '获取非 RUN 站点列表失败'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  // 同一站点可能被多次标记（更正原因），列表上只显示最近一次
  const latestMark = useMemo(() => {
    const map = new Map()
    for (const mark of marks) {
      if (!map.has(mark.siteId)) map.set(mark.siteId, mark)
    }
    return map
  }, [marks])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return sites.filter((site) => {
      if (statusFilter && site.status !== statusFilter) return false
      if (!keyword) return true
      return (
        String(site.name || '').toLowerCase().includes(keyword) ||
        String(site.url || '').toLowerCase().includes(keyword) ||
        String(site.id).includes(keyword)
      )
    })
  }, [sites, search, statusFilter])

  const visible = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  )

  const openDialog = (site) => {
    const existing = latestMark.get(site.id)
    setTarget(site)
    setReason(existing?.reason && NON_RUN_REMOVAL_REASONS.includes(existing.reason) ? existing.reason : NON_RUN_REMOVAL_REASONS[0])
    setDetail(existing?.detail || '')
  }

  const submit = async () => {
    if (!target || saving) return
    const trimmedDetail = detail.trim()
    if (reason === OTHER_REASON && !trimmedDetail) {
      showToast('选择「其他」时必须填写具体原因', 'warning')
      return
    }

    setSaving(true)
    try {
      const record = await markRemoval({
        siteId: target.id,
        name: target.name || '',
        url: target.url || '',
        status: target.status || null,
        reason,
        detail: trimmedDetail || null
      })
      if (record) setMarks((list) => [record, ...list])
      setTarget(null)
      showToast('已标记待删除：' + (target.name || 'ID ' + target.id))
    } catch (error) {
      showToast(errorMessage(error, '标记待删除失败'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusOptions = useMemo(() => {
    const counts = new Map()
    for (const site of sites) counts.set(site.status, (counts.get(site.status) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [sites])

  return (
    <Box className="mx-auto max-w-6xl">
      <Box className="flex flex-wrap items-end justify-between gap-3">
        <Box>
          <Typography variant="h4" className="font-semibold text-slate-900">
            规则修订专题 · 非 RUN 倒查
          </Typography>
          <Typography color="text.secondary" className="mt-1">
            核对截止 {SNAPSHOT_DATE} 成员列表中状态非 RUN 的站点（含 WAIT），确认是否确实不符合要求并标记待删除。
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button variant="outlined" onClick={load} disabled={loading}>
            刷新列表
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (marks.length === 0) {
                showToast('还没有任何标记记录，暂无可导出的台账', 'warning')
                return
              }
              downloadCsv(marks)
            }}
          >
            导出台账 CSV（{marks.length}）
          </Button>
        </Box>
      </Box>

      <Alert severity="info" className="mt-5">
        标记只登记，不会直接删除上游站点；真正删除由专题结束后统一执行。所有标记（含更正原因）都会保留在台账里并可导出为 CSV 公示。
      </Alert>

      <Card className="mt-4 rounded-2xl">
        <CardContent>
          <Box className="flex flex-wrap items-center gap-3">
            <TextField
              size="small"
              label="按名称 / 网址 / ID 筛选"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              className="min-w-[240px] flex-1"
            />
            <FormControl size="small" className="min-w-[180px]">
              <InputLabel id="non-run-status-label">状态</InputLabel>
              <Select
                labelId="non-run-status-label"
                label="状态"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value="">全部状态</MenuItem>
                {statusOptions.map(([value, count]) => (
                  <MenuItem key={value || 'unknown'} value={value || ''}>
                    {statusLabel(value)}（{count}）
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className="mt-3 flex flex-wrap gap-2">
            <Chip size="small" label={'非 RUN 站点 ' + sites.length} />
            <Chip size="small" label={'当前筛选 ' + filtered.length} />
            <Chip size="small" color="warning" label={'已标记待删除 ' + latestMark.size} />
          </Box>

          {loading && sites.length === 0 ? (
            <Box className="flex justify-center py-10">
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography color="text.secondary" className="py-10 text-center">
              没有符合条件的非 RUN 站点。
            </Typography>
          ) : (
            <Box className="mt-4 overflow-x-auto">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>站点</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>巡查备注</TableCell>
                    <TableCell>处理</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((site) => {
                    const marked = latestMark.get(site.id)
                    let href = null
                    try {
                      href = site.url ? safeSiteUrl(site.url) : null
                    } catch {
                      href = null
                    }
                    return (
                      <TableRow key={site.id} hover>
                        <TableCell>{site.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-medium">
                            {site.name || '未命名站点'}
                          </Typography>
                          {href ? (
                            <Link href={href} target="_blank" rel="noopener noreferrer" className="break-all text-xs">
                              {href}
                            </Link>
                          ) : (
                            <Typography variant="caption" color="error">
                              链接无效
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={statusLabel(site.status)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {site.failedReason || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {marked ? (
                            <Box className="flex flex-col gap-1">
                              <Chip size="small" color="warning" label={'待删除：' + marked.reason} />
                              {marked.detail ? (
                                <Typography variant="caption" color="text.secondary">
                                  {marked.detail}
                                </Typography>
                              ) : null}
                              <Button size="small" onClick={() => openDialog(site)}>
                                更正原因
                              </Button>
                            </Box>
                          ) : (
                            <Button size="small" color="error" onClick={() => openDialog(site)}>
                              标记待删除
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(0)
                }}
                rowsPerPageOptions={[20, 50, 100]}
                labelRowsPerPage="每页"
                labelDisplayedRows={({ from, to, count }) => from + '-' + to + ' / ' + count}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(target)} onClose={() => (saving ? null : setTarget(null))} fullWidth maxWidth="sm">
        <DialogTitle>标记待删除</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {target?.name || ''}（ID {target?.id}）
          </Typography>
          <FormControl fullWidth size="small" className="mt-4">
            <InputLabel id="non-run-reason-label">删除原因</InputLabel>
            <Select
              labelId="non-run-reason-label"
              label="删除原因"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {NON_RUN_REMOVAL_REASONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            className="mt-4"
            label={reason === OTHER_REASON ? '具体原因（必填）' : '补充说明（选填）'}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            multiline
            minRows={2}
            required={reason === OTHER_REASON}
            helperText={reason === OTHER_REASON ? '选择「其他」时必须说明具体原因，公示时一并展示。' : '可留空。'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)} disabled={saving}>
            取消
          </Button>
          <Button variant="contained" color="error" onClick={submit} disabled={saving}>
            {saving ? '提交中…' : '确认标记'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((value) => ({ ...value, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
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

export default NonRunReviewPage

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
  Divider,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Stack,
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
  fetchVerdicts,
  NON_RUN_REMOVAL_REASONS,
  OTHER_REASON,
  submitVerdict,
  VERDICT_ABNORMAL,
  VERDICT_DELETE,
  VERDICT_KEEP,
  VERDICT_LABEL
} from '../api/nonRunRemovals'
import { fetchReviewSites, safeSiteUrl, SITE_STATUS_OPTIONS } from '../api/travellings'

// 专题基准日：页面核对的「成员列表」以这一天为准，公示里也要写清口径。
const SNAPSHOT_DATE = '2026-11-28'
const STATUS_LABEL = new Map(SITE_STATUS_OPTIONS.map((option) => [option.value, option.label]))

const VERDICT_COLOR = {
  [VERDICT_KEEP]: 'success',
  [VERDICT_ABNORMAL]: 'info',
  [VERDICT_DELETE]: 'warning'
}

const SCOPE_OPTIONS = [
  { value: 'pending', label: '待判定' },
  { value: 'done', label: '已判定' },
  { value: 'all', label: '全部' }
]

function statusLabel(status) {
  const label = STATUS_LABEL.get(status)
  return label && label !== status ? status + '（' + label + '）' : status || '—'
}

function verdictLabel(record) {
  if (!record) return '—'
  const base = VERDICT_LABEL[record.verdict] || record.verdict
  return record.verdict === VERDICT_DELETE && record.reason ? base + '：' + record.reason : base
}

function toCsv(rows) {
  const header = ['站点ID', '站点名称', '网址', '状态', '判定', '删除原因', '补充说明', '操作人', '判定时间']
  const cell = (value) => {
    let text = String(value ?? '')
    // 防 CSV 公式注入：Excel 会把 = + - @ 开头的单元格当公式执行
    if (/^[=+\-@]/.test(text)) text = "'" + text
    return '"' + text.replace(/"/g, '""') + '"'
  }
  const lines = [
    header,
    ...rows.map((row) => [
      row.siteId,
      row.name,
      row.url,
      row.status,
      row.verdict,
      row.reason,
      row.detail,
      row.operator,
      row.createdAt
    ])
  ]
  return '\ufeff' + lines.map((line) => line.map(cell).join(',')).join('\r\n')
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '非RUN站点判定台账_' + SNAPSHOT_DATE + '.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function NonRunReviewPage() {
  const [sites, setSites] = useState([])
  const [verdicts, setVerdicts] = useState([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('list')
  const [workbenchIndex, setWorkbenchIndex] = useState(0)
  const [scope, setScope] = useState('pending')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [target, setTarget] = useState(null)
  const [verdict, setVerdict] = useState(VERDICT_KEEP)
  const [reason, setReason] = useState(NON_RUN_REMOVAL_REASONS[0])
  const [detail, setDetail] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [siteList, verdictList] = await Promise.all([fetchReviewSites(), fetchVerdicts()])
      setSites(siteList)
      setVerdicts(verdictList)
    } catch (error) {
      showToast(errorMessage(error, '获取非 RUN 站点列表失败'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  // 同一站点可能被改判多次（台账只追加），列表上只显示最近一次
  const latestVerdict = useMemo(() => {
    const map = new Map()
    for (const record of verdicts) {
      if (!map.has(record.siteId)) map.set(record.siteId, record)
    }
    return map
  }, [verdicts])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return sites.filter((site) => {
      const judged = latestVerdict.has(site.id)
      // 判定过的站点不再进入待判定队列，避免重复核对
      if (scope === 'pending' && judged) return false
      if (scope === 'done' && !judged) return false
      if (statusFilter && site.status !== statusFilter) return false
      if (!keyword) return true
      return (
        String(site.name || '').toLowerCase().includes(keyword) ||
        String(site.url || '').toLowerCase().includes(keyword) ||
        String(site.id).includes(keyword)
      )
    })
  }, [sites, latestVerdict, scope, search, statusFilter])

  const visible = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  )

  const openDialog = (site, presetVerdict) => {
    const existing = latestVerdict.get(site.id)
    setTarget(site)
    setVerdict(presetVerdict || existing?.verdict || VERDICT_KEEP)
    setReason(
      existing?.reason && NON_RUN_REMOVAL_REASONS.includes(existing.reason)
        ? existing.reason
        : NON_RUN_REMOVAL_REASONS[0]
    )
    setDetail(existing?.detail || '')
    setConfirmName('')
  }

  const submit = async () => {
    if (!target || saving) return
    const trimmedDetail = detail.trim()
    if (verdict === VERDICT_DELETE) {
      if (reason === OTHER_REASON && !trimmedDetail) {
        showToast('选择「其他」时必须填写具体原因', 'warning')
        return
      }
      // 上游删除不可逆，要求输入站点名确认是本人有意为之
      if (confirmName.trim() !== (target.name || '').trim()) {
        showToast('请输入站点名称以确认删除', 'warning')
        return
      }
    }

    setSaving(true)
    try {
      const record = await submitVerdict({
        siteId: target.id,
        name: target.name || '',
        url: target.url || '',
        status: target.status || null,
        verdict,
        reason: verdict === VERDICT_DELETE ? reason : null,
        detail: trimmedDetail || null
      })
      if (record) setVerdicts((list) => [record, ...list])
      setTarget(null)
      showToast(
        verdict === VERDICT_DELETE
          ? '已删除上游站点并记录台账：' + (target.name || 'ID ' + target.id)
          : '已同步上游并记录判定：' + (target.name || 'ID ' + target.id) + ' → ' + verdictLabel(record)
      )
    } catch (error) {
      showToast(errorMessage(error, '提交判定失败'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // 工作台里「符合规则 / 标记异常」直接提交；「删除」必须走弹窗补原因与二次确认
  const judgeQuick = async (site, nextVerdict) => {
    if (!site || saving) return
    if (nextVerdict === VERDICT_DELETE) {
      openDialog(site, VERDICT_DELETE)
      return
    }
    setSaving(true)
    try {
      const record = await submitVerdict({
        siteId: site.id,
        name: site.name || '',
        url: site.url || '',
        status: site.status || null,
        verdict: nextVerdict,
        reason: null,
        detail: null
      })
      if (record) setVerdicts((list) => [record, ...list])
      showToast('已同步上游并记录判定：' + (site.name || 'ID ' + site.id) + ' → ' + verdictLabel(record))
    } catch (error) {
      showToast(errorMessage(error, '提交判定失败'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusOptions = useMemo(() => {
    const counts = new Map()
    for (const site of sites) counts.set(site.status, (counts.get(site.status) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [sites])

  const judgedCount = useMemo(
    () => sites.filter((site) => latestVerdict.has(site.id)).length,
    [sites, latestVerdict]
  )

  // 工作台按「当前筛选结果」顺序逐条核对；判定完的站点自动离开队列，指针不动即自动指向下一条
  const current = filtered.length ? filtered[Math.min(workbenchIndex, filtered.length - 1)] : null

  const currentHref = useMemo(() => {
    if (!current?.url) return null
    try {
      return safeSiteUrl(current.url)
    } catch {
      return null
    }
  }, [current])

  // 换筛选条件时回到队列开头，避免指针停在一个不相关的位置
  useEffect(() => {
    setWorkbenchIndex(0)
  }, [scope, search, statusFilter])

  return (
    <Box className="mx-auto max-w-6xl">
      <Box className="flex flex-wrap items-end justify-between gap-3">
        <Box>
          <Typography variant="h4" className="font-semibold text-slate-900">
            规则修订专题 · 非 RUN 倒查
          </Typography>
          <Typography color="text.secondary" className="mt-1">
            逐条核对截止 {SNAPSHOT_DATE} 成员列表中状态非 RUN 的站点（含 WAIT），判定其是否符合成员规则。
          </Typography>
        </Box>
        <Box className="flex flex-wrap gap-2">
          <Button variant={mode === 'list' ? 'contained' : 'outlined'} onClick={() => setMode('list')}>
            列表模式
          </Button>
          <Button variant={mode === 'workbench' ? 'contained' : 'outlined'} onClick={() => setMode('workbench')}>
            工作台模式
          </Button>
          <Button variant="outlined" onClick={load} disabled={loading}>
            刷新
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (verdicts.length === 0) {
                showToast('还没有任何判定记录，暂无可导出的台账', 'warning')
                return
              }
              downloadCsv(verdicts)
            }}
          >
            导出台账 CSV（{verdicts.length}）
          </Button>
        </Box>
      </Box>

      <Alert severity="warning" className="mt-5">
        判定会<strong>立即同步上游</strong>：符合规则 → 状态改回 RUN；异常待定 → 状态改为 WAIT；删除 → <strong>直接删除上游站点且无法恢复</strong>。每次判定（含改判）都会追加到台账并可导出 CSV 公示。
      </Alert>

      <Card className="mt-4 rounded-2xl">
        <CardContent>
          <Box className="flex flex-wrap items-center gap-3">
            <FormControl size="small" className="min-w-[140px]">
              <InputLabel id="non-run-scope-label">范围</InputLabel>
              <Select
                labelId="non-run-scope-label"
                label="范围"
                value={scope}
                onChange={(event) => {
                  setScope(event.target.value)
                  setPage(0)
                }}
              >
                {SCOPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="按名称 / 网址 / ID 筛选"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              className="min-w-[220px] flex-1"
            />
            <FormControl size="small" className="min-w-[170px]">
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
            <Chip size="small" color="success" label={'已判定 ' + judgedCount} />
            <Chip size="small" label={'剩余待判定 ' + (sites.length - judgedCount)} />
            <Chip size="small" label={'当前筛选 ' + filtered.length} />
          </Box>

          {mode === 'workbench' ? (
            <Box className="mt-4 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Box className="flex flex-col gap-3">
                <Box>
                  <Box className="mb-1 flex items-center justify-between">
                    <Typography variant="body2" className="font-medium">
                      进度
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {judgedCount} / {sites.length}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={sites.length ? Math.round((judgedCount / sites.length) * 100) : 0}
                    className="rounded"
                  />
                  <Typography variant="caption" color="text.secondary" className="mt-1 block">
                    当前筛选剩余 {filtered.length} 条，本条第 {Math.min(workbenchIndex + 1, filtered.length)} 条
                  </Typography>
                </Box>

                <Divider />

                {current ? (
                  <>
                    <Box>
                      <Typography variant="h6" className="font-semibold text-slate-900">
                        {current.name || '未命名站点'}
                      </Typography>
                      <Box className="mt-2 flex flex-wrap items-center gap-1">
                        <Chip size="small" label={'ID ' + current.id} />
                        <Chip size="small" label={statusLabel(current.status)} />
                      </Box>
                      {currentHref ? (
                        <Link
                          href={currentHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block break-all text-xs"
                        >
                          {currentHref}
                        </Link>
                      ) : (
                        <Typography variant="caption" color="error" className="mt-2 block">
                          链接无效
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        巡查备注
                      </Typography>
                      <Typography variant="body2" className="break-all">
                        {current.failedReason || '—'}
                      </Typography>
                    </Box>

                    <Divider />

                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        disabled={saving}
                        onClick={() => judgeQuick(current, VERDICT_KEEP)}
                      >
                        符合规则（改回 RUN）
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        disabled={saving}
                        onClick={() => judgeQuick(current, VERDICT_ABNORMAL)}
                      >
                        标记异常（改为 WAIT）
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        disabled={saving}
                        onClick={() => judgeQuick(current, VERDICT_DELETE)}
                      >
                        删除（不可恢复）
                      </Button>
                      <Button
                        fullWidth
                        variant="text"
                        disabled={saving || workbenchIndex >= filtered.length - 1}
                        onClick={() => setWorkbenchIndex((value) => value + 1)}
                      >
                        跳过，下一条
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Typography color="text.secondary" className="py-6 text-center">
                    {scope === 'pending' && sites.length > 0
                      ? '待判定队列已清空，切到「已判定」可复核。'
                      : '没有符合条件的站点。'}
                  </Typography>
                )}
              </Box>

              <Box className="min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {currentHref ? (
                  <Box
                    component="iframe"
                    key={currentHref}
                    src={currentHref}
                    title={'站点预览 ' + (current?.name || '')}
                    referrerPolicy="no-referrer"
                    className="h-[calc(100vh-300px)] min-h-[420px] w-full border-0 bg-white"
                  />
                ) : (
                  <Box className="flex h-full items-center justify-center p-6">
                    <Typography color="text.secondary" className="text-center">
                      该站点没有可用链接，请在左侧直接判定。
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : loading && sites.length === 0 ? (
            <Box className="flex justify-center py-10">
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography color="text.secondary" className="py-10 text-center">
              {scope === 'pending' && sites.length > 0
                ? '全部非 RUN 站点都已完成判定，切到「已判定」可复核结果。'
                : '没有符合条件的站点。'}
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
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>判定</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((site) => {
                    const record = latestVerdict.get(site.id)
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
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {record ? (
                            <Box className="flex flex-col gap-1">
                              <Chip size="small" color={VERDICT_COLOR[record.verdict] || 'default'} label={verdictLabel(record)} />
                              {record.detail ? (
                                <Typography variant="caption" color="text.secondary">
                                  {record.detail}
                                </Typography>
                              ) : null}
                              <Typography variant="caption" color="text.secondary">
                                {record.operator} · {record.createdAt}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                              未判定
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {record ? (
                            <Button size="small" onClick={() => openDialog(site)}>
                              改判
                            </Button>
                          ) : (
                            <Stack direction="row" spacing={1}>
                              <Button size="small" color="success" onClick={() => openDialog(site, VERDICT_KEEP)}>
                                符合规则
                              </Button>
                              <Button size="small" color="info" onClick={() => openDialog(site, VERDICT_ABNORMAL)}>
                                标记异常
                              </Button>
                              <Button size="small" color="error" onClick={() => openDialog(site, VERDICT_DELETE)}>
                                删除
                              </Button>
                            </Stack>
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
        <DialogTitle>提交判定</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {target?.name || ''}（ID {target?.id}）
          </Typography>
          <FormControl fullWidth size="small" className="mt-4">
            <InputLabel id="non-run-verdict-label">判定结果</InputLabel>
            <Select
              labelId="non-run-verdict-label"
              label="判定结果"
              value={verdict}
              onChange={(event) => setVerdict(event.target.value)}
            >
              <MenuItem value={VERDICT_KEEP}>{VERDICT_LABEL[VERDICT_KEEP]}</MenuItem>
              <MenuItem value={VERDICT_ABNORMAL}>{VERDICT_LABEL[VERDICT_ABNORMAL]}</MenuItem>
              <MenuItem value={VERDICT_DELETE}>{VERDICT_LABEL[VERDICT_DELETE]}</MenuItem>
            </Select>
          </FormControl>
          {verdict === VERDICT_DELETE ? (
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
          ) : null}
          <TextField
            fullWidth
            size="small"
            className="mt-4"
            label={
              verdict === VERDICT_DELETE && reason === OTHER_REASON
                ? '具体原因（必填）'
                : verdict === VERDICT_ABNORMAL
                  ? '异常说明（选填）'
                  : '补充说明（选填）'
            }
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            multiline
            minRows={2}
            required={verdict === VERDICT_DELETE && reason === OTHER_REASON}
            helperText={
              verdict === VERDICT_DELETE && reason === OTHER_REASON
                ? '选择「其他」时必须说明具体原因，公示时一并展示。'
                : '可留空。'
            }
          />
          {verdict === VERDICT_DELETE ? (
            <TextField
              fullWidth
              size="small"
              className="mt-4"
              label="输入站点名称以确认删除"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              helperText="删除上游站点后无法恢复，请确认是本人有意为之。"
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)} disabled={saving}>
            取消
          </Button>
          <Button
            variant="contained"
            color={verdict === VERDICT_DELETE ? 'error' : 'primary'}
            onClick={submit}
            disabled={saving || (verdict === VERDICT_DELETE && confirmName.trim() !== (target?.name || '').trim())}
          >
            {saving ? '提交中…' : verdict === VERDICT_DELETE ? '确认删除' : '确认判定'}
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

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { call, errorMessage, listOf } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { formatTime } from '../utils/time'

const PAGE_SIZE = 100

// 后端没有独立的巡查记录表；所有巡查/标记操作都写入 logs，这里展示的就是它。
function RecordsPage() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchPage = useCallback(
    async (target) => {
      setLoading(true)
      try {
        const body = await call(api.get('/log', { params: { page: target, size: PAGE_SIZE } }))
        const rows = listOf(body)
        setLogs((prev) => (target === 0 ? rows : [...prev, ...rows]))
        setPage(target)
        setHasMore(rows.length === PAGE_SIZE)
      } catch (error) {
        showToast(errorMessage(error, '获取操作日志失败'), 'error')
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  useEffect(() => {
    fetchPage(0)
  }, [fetchPage])

  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase()
    if (!value) return logs
    return logs.filter((log) => `${log.user} ${log.action}`.toLowerCase().includes(value))
  }, [logs, keyword])

  async function runDelete() {
    const target = confirm
    setConfirm(null)
    try {
      await call(api.delete(`/log/${target === 'all' ? 'all' : target.id}`))
      showToast(target === 'all' ? '日志已全部清空' : '日志已删除')
      if (target === 'all') setLogs([])
      else setLogs((prev) => prev.filter((log) => log.id !== target.id))
    } catch (error) {
      showToast(errorMessage(error, '删除失败'), 'error')
    }
  }

  return (
    <Box className="mx-auto max-w-6xl">
      <Box className="flex flex-wrap items-end justify-between gap-3">
        <Box>
          <Typography variant="h4" className="font-semibold text-slate-900">
            操作日志
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            巡查、标记异常/误报、重启巡查等操作都会记录在这里。
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <TextField size="small" label="筛选用户/内容" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          {isAdmin ? (
            <Button color="error" variant="outlined" onClick={() => setConfirm('all')} disabled={logs.length === 0}>
              清空
            </Button>
          ) : null}
        </Box>
      </Box>

      <Card className="mt-4 rounded-2xl bg-white/90 shadow-sm">
        <CardContent>
          {!loading && filtered.length === 0 ? (
            <Typography color="text.secondary" className="py-10 text-center">
              {logs.length === 0 ? '暂无操作日志' : '没有匹配的日志'}
            </Typography>
          ) : (
            <Box className="overflow-x-auto">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>时间</TableCell>
                    <TableCell>用户</TableCell>
                    <TableCell>操作</TableCell>
                    <TableCell>IP</TableCell>
                    {isAdmin ? <TableCell align="right" /> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell className="whitespace-nowrap">{formatTime(log.timestamp)}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="whitespace-nowrap">{log.ip || '—'}</TableCell>
                      {isAdmin ? (
                        <TableCell align="right">
                          <Tooltip title="删除">
                            <IconButton size="small" onClick={() => setConfirm(log)}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {loading ? (
            <Box className="flex justify-center py-6">
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {!loading && hasMore ? (
            <Box className="mt-3 flex justify-center">
              <Button onClick={() => fetchPage(page + 1)}>加载更多</Button>
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm === 'all' ? '清空全部日志？' : '删除这条日志？'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm === 'all' ? '所有操作日志都会被永久删除，无法恢复。' : confirm?.action}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>取消</Button>
          <Button color="error" variant="contained" onClick={runDelete}>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2600} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default RecordsPage

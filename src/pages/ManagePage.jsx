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
  DialogContentText,
  DialogTitle,
  Link,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from '@mui/material'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { useCallback, useEffect, useState } from 'react'
import api, { call, errorMessage, listOf } from '../api/client'

const TABS = [
  { key: 'abnormal', label: '异常站点', endpoint: '/AbnormalSites', empty: '没有待处理的异常站点' },
  { key: 'checkError', label: '机器误报', endpoint: '/CheckError', empty: '没有机器误报记录' },
  { key: 'unchecked', label: '待巡查', endpoint: '/sites', empty: '本轮站点已全部巡查' }
]

function SiteLink({ url }) {
  if (!url) return '—'
  return (
    <Link href={url} target="_blank" rel="noreferrer" className="break-all">
      {url}
    </Link>
  )
}

function ManagePage() {
  const [tab, setTab] = useState('abnormal')
  const [rows, setRows] = useState({})
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchTab = useCallback(
    async (key) => {
      const config = TABS.find((item) => item.key === key)
      setLoading(true)
      try {
        const body = await call(api.get(config.endpoint))
        setRows((prev) => ({ ...prev, [key]: listOf(body) }))
      } catch (error) {
        showToast(errorMessage(error, '获取列表失败'), 'error')
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  useEffect(() => {
    fetchTab(tab)
  }, [tab, fetchTab])

  async function runAction(action) {
    setConfirm(null)
    setBusyKey(action.busyKey)
    try {
      await call(action.request())
      showToast(action.success)
      if (action.refresh) await fetchTab(action.refresh)
    } catch (error) {
      showToast(errorMessage(error, '操作失败'), 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const clearAbnormal = (site) => ({
    busyKey: `abnormal-${site.id}`,
    title: '撤销异常标记？',
    body: `「${site.name}」的状态将恢复为 RUN。`,
    request: () => api.delete(`/AbnormalSites/${site.id}`),
    success: '已恢复为正常',
    refresh: 'abnormal'
  })

  const deleteCheckError = (item) => ({
    busyKey: `checkError-${item.name}`,
    title: '删除误报记录？',
    body: `从机器误报列表中移除「${item.name}」。`,
    request: () => api.delete(`/CheckError/${encodeURIComponent(item.name)}`),
    success: '误报记录已删除',
    refresh: 'checkError'
  })

  const restartCheck = {
    busyKey: 'restart',
    title: '重启本轮巡查？',
    body: '所有站点的「已巡查」标记都会被清除，大家会从头重新领取。',
    request: () => api.get('/checkRestart'),
    success: '已重启巡查',
    refresh: 'unchecked'
  }

  const current = rows[tab] || []
  const currentTab = TABS.find((item) => item.key === tab)

  return (
    <Box className="mx-auto max-w-6xl">
      <Box className="flex flex-wrap items-end justify-between gap-3">
        <Typography variant="h4" className="font-semibold text-slate-900">
          异常管理
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestartAltRoundedIcon />}
          disabled={busyKey === 'restart'}
          onClick={() => setConfirm(restartCheck)}
        >
          重启巡查
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} className="mt-4">
        {TABS.map((item) => (
          <Tab key={item.key} value={item.key} label={rows[item.key] ? `${item.label}（${rows[item.key].length}）` : item.label} />
        ))}
      </Tabs>

      <Card className="mt-3 rounded-2xl">
        <CardContent>
          {loading && current.length === 0 ? (
            <Box className="flex justify-center py-8">
              <CircularProgress />
            </Box>
          ) : current.length === 0 ? (
            <Typography color="text.secondary" className="py-8 text-center">
              {currentTab.empty}
            </Typography>
          ) : (
            <Box className="overflow-x-auto">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {tab !== 'checkError' ? <TableCell>ID</TableCell> : null}
                    <TableCell>名称</TableCell>
                    <TableCell>链接</TableCell>
                    <TableCell>{tab === 'checkError' ? '误报原因' : '状态'}</TableCell>
                    {tab === 'unchecked' ? <TableCell>失败原因</TableCell> : null}
                    {tab !== 'unchecked' ? <TableCell align="right">操作</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {current.map((item) => (
                    <TableRow key={tab === 'checkError' ? item.name : item.id} hover>
                      {tab !== 'checkError' ? <TableCell>{item.id}</TableCell> : null}
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <SiteLink url={item.url} />
                      </TableCell>
                      <TableCell>
                        {tab === 'checkError' ? item.errorReason || '—' : <Chip size="small" label={item.status || '未知'} />}
                      </TableCell>
                      {tab === 'unchecked' ? <TableCell>{item.failedReason || '—'}</TableCell> : null}
                      {tab === 'abnormal' ? (
                        <TableCell align="right">
                          <Button size="small" disabled={busyKey === `abnormal-${item.id}`} onClick={() => setConfirm(clearAbnormal(item))}>
                            恢复正常
                          </Button>
                        </TableCell>
                      ) : null}
                      {tab === 'checkError' ? (
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="error"
                            disabled={busyKey === `checkError-${item.name}`}
                            onClick={() => setConfirm(deleteCheckError(item))}
                          >
                            删除
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {tab === 'checkError' ? (
        <Alert severity="info" className="mt-3">
          误报记录只用于告知巡查机器维护者；删除记录不会改动站点本身的状态。
        </Alert>
      ) : null}

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm?.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>取消</Button>
          <Button variant="contained" onClick={() => runAction(confirm)}>
            确定
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

export default ManagePage

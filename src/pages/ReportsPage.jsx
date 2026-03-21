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
  Typography
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import api from '../api/client'

function getStatusColor(status) {
  if (status === 'pending') return 'warning'
  if (status === 'processing') return 'info'
  if (status === 'resolved') return 'success'
  return 'default'
}

function getStatusText(status) {
  if (status === 'pending') return '待处理'
  if (status === 'processing') return '处理中'
  if (status === 'resolved') return '已解决'
  return status || '未知'
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleString('zh-CN')
}

function ReportsPage() {
  const { user } = useAuth()
  const isAdmin = useMemo(() => user?.role === 1, [user])

  const [reports, setReports] = useState([])
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const [newReport, setNewReport] = useState({
    title: '',
    content: '',
    web_id: ''
  })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/reports/list')
      if (response.data?.success) {
        setReports(response.data.data || [])
      }
    } catch {
      showToast('获取报告列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  async function submitReport(event) {
    event.preventDefault()
    if (!newReport.title || !newReport.content) {
      showToast('请填写标题和内容', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/reports/submit', {
        ...newReport,
        web_id: newReport.web_id ? Number(newReport.web_id) : null
      })
      showToast('报告提交成功')
      setShowSubmitForm(false)
      setNewReport({ title: '', content: '', web_id: '' })
      fetchReports()
    } catch (error) {
      showToast(error.response?.data?.msg || '提交失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateReportStatus(report, status) {
    try {
      await api.put(`/reports/${report.id}/update`, { status })
      showToast('报告状态已更新')
      fetchReports()
    } catch (error) {
      showToast(error.response?.data?.msg || '更新失败', 'error')
    }
  }

  return (
    <Box className="mx-auto max-w-5xl">
      <Typography variant="h4" className="font-semibold text-slate-900">
        情况报告
      </Typography>

      <Box className="mt-4">
        <Button variant="contained" onClick={() => setShowSubmitForm((open) => !open)}>
          {showSubmitForm ? '取消提交' : '提交报告'}
        </Button>
      </Box>

      {showSubmitForm ? (
        <Card className="mt-4 rounded-2xl">
          <CardContent>
            <Typography variant="h6" className="font-semibold">
              提交新报告
            </Typography>
            <Box component="form" className="mt-4 space-y-4" onSubmit={submitReport}>
              <TextField
                fullWidth
                required
                label="标题"
                value={newReport.title}
                onChange={(event) => setNewReport((prev) => ({ ...prev, title: event.target.value }))}
              />
              <TextField
                fullWidth
                required
                label="内容"
                multiline
                rows={6}
                value={newReport.content}
                onChange={(event) => setNewReport((prev) => ({ ...prev, content: event.target.value }))}
              />
              <TextField
                fullWidth
                type="number"
                label="关联网站ID（可选）"
                value={newReport.web_id}
                onChange={(event) => setNewReport((prev) => ({ ...prev, web_id: event.target.value }))}
              />
              <Box className="flex gap-2">
                <Button type="submit" variant="contained" disabled={submitting}>
                  提交
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setShowSubmitForm(false)
                    setNewReport({ title: '', content: '', web_id: '' })
                  }}
                >
                  取消
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Box className="mt-8 flex justify-center">
          <CircularProgress />
        </Box>
      ) : null}

      {!loading && reports.length === 0 ? (
        <Card className="mt-4 rounded-2xl">
          <CardContent className="py-10 text-center">
            <Typography color="text.secondary">暂无报告</Typography>
          </CardContent>
        </Card>
      ) : null}

      <Box className="mt-4 space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="rounded-2xl">
            <CardContent>
              <Box className="flex flex-wrap items-center justify-between gap-2">
                <Typography variant="h6" className="font-semibold">
                  {report.title}
                </Typography>
                <Box className="flex items-center gap-2">
                  <Chip size="small" color={getStatusColor(report.status)} label={getStatusText(report.status)} />
                  {isAdmin ? (
                    <Box className="flex gap-1">
                      {report.status !== 'pending' ? (
                        <Button size="small" onClick={() => updateReportStatus(report, 'pending')}>
                          待处理
                        </Button>
                      ) : null}
                      {report.status !== 'processing' ? (
                        <Button size="small" onClick={() => updateReportStatus(report, 'processing')}>
                          处理中
                        </Button>
                      ) : null}
                      {report.status !== 'resolved' ? (
                        <Button size="small" onClick={() => updateReportStatus(report, 'resolved')}>
                          已解决
                        </Button>
                      ) : null}
                    </Box>
                  ) : null}
                </Box>
              </Box>

              <Typography className="mt-3 whitespace-pre-wrap">{report.content}</Typography>
              <Box className="mt-3 space-y-1 text-sm text-slate-600">
                <Typography variant="body2">提交人: {report.user?.email || '未知'}</Typography>
                {report.web ? (
                  <Typography variant="body2">
                    关联网站:
                    <Link href={report.web.link} target="_blank" rel="noreferrer" className="ml-1">
                      {report.web.name}
                    </Link>
                    （ID: {report.web.id}）
                  </Typography>
                ) : null}
                <Typography variant="body2">提交时间: {formatTime(report.created_at)}</Typography>
                {report.updated_at ? <Typography variant="body2">更新时间: {formatTime(report.updated_at)}</Typography> : null}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ReportsPage

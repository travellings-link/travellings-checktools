import { Alert, Box, Card, CardContent, Chip, CircularProgress, Link, Snackbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import api from '../api/client'

function getStatusColor(result) {
  if (result === '正常') return 'success'
  if (result === '异常') return 'error'
  if (result === '误报') return 'warning'
  return 'default'
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleString('zh-CN')
}

function RecordsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '' })

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true)
      try {
        const response = await api.get('/sites/all-records')
        if (response.data?.success && response.data.data) {
          setRecords(Array.isArray(response.data.data) ? response.data.data : [])
        } else {
          setRecords([])
        }
      } catch (error) {
        setToast({
          open: true,
          message: `获取巡查记录失败: ${error.response?.data?.msg || error.message || '未知错误'}`
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  return (
    <Box className="mx-auto max-w-5xl">
      <Typography variant="h4" className="font-semibold text-slate-900">
        巡查记录
      </Typography>

      {loading ? (
        <Box className="mt-8 flex justify-center">
          <CircularProgress />
        </Box>
      ) : null}

      {!loading && records.length === 0 ? (
        <Card className="mt-5 rounded-2xl bg-white/90 shadow-sm backdrop-blur">
          <CardContent className="py-10 text-center">
            <Typography color="text.secondary">暂无巡查记录</Typography>
          </CardContent>
        </Card>
      ) : null}

      <Box className="mt-4 space-y-4">
        {records.map((record) => (
          <Card key={record.id} className="rounded-2xl bg-white/90 shadow-sm backdrop-blur">
            <CardContent>
              <Box className="flex items-center justify-between gap-2">
                <Typography variant="h6" className="font-semibold">
                  {record.web?.name || '未知网站'}
                </Typography>
                <Chip size="small" label={record.check_result || '未知'} color={getStatusColor(record.check_result)} />
              </Box>

              <Box className="mt-3 space-y-1 text-sm text-slate-600">
                <Typography variant="body2">
                  网站：
                  {record.web?.link ? (
                    <Link href={record.web.link} target="_blank" rel="noreferrer">
                      {record.web.link}
                    </Link>
                  ) : (
                    '未知'
                  )}
                </Typography>
                {record.check_note ? <Typography variant="body2">备注：{record.check_note}</Typography> : null}
                <Typography variant="body2">巡查时间：{formatTime(record.created_at)}</Typography>
                {record.user ? <Typography variant="body2">巡查人：{record.user.email}</Typography> : null}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2800}
        onClose={() => setToast({ open: false, message: '' })}
      >
        <Alert severity="error" variant="filled" onClose={() => setToast({ open: false, message: '' })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default RecordsPage

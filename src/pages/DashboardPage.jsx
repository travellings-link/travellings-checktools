import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api, { call, errorMessage, listOf } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import StatCard from '../components/StatCard'

function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      setLoading(true)
      setError('')
      // 后端没有聚合统计接口，用现有列表接口拼；任何一项失败只影响该卡片。
      const tasks = {
        count: call(api.get('/count')).then((body) => body.data?.count ?? 0),
        unchecked: call(api.get('/sites')).then((body) => listOf(body).length)
      }
      if (isAdmin) {
        tasks.abnormal = call(api.get('/AbnormalSites')).then((body) => listOf(body).length)
        tasks.checkError = call(api.get('/CheckError')).then((body) => listOf(body).length)
      }

      const keys = Object.keys(tasks)
      const results = await Promise.allSettled(Object.values(tasks))
      if (cancelled) return

      const next = {}
      let firstFailure = ''
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') next[keys[index]] = result.value
        else if (!firstFailure) firstFailure = errorMessage(result.reason, '部分统计获取失败')
      })
      setStats(next)
      setError(firstFailure)
      setLoading(false)
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  return (
    <Box>
      <Typography variant="h4" className="font-semibold text-slate-900">
        仪表盘
      </Typography>
      <Typography variant="body1" color="text.secondary" className="mt-1">
        {user?.name ? `${user.name}，欢迎回来。` : '统一查看巡查工作进度。'}
      </Typography>

      {error ? (
        <Alert severity="warning" className="mt-4">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box className="mt-8 flex justify-center">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} className="mt-2">
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title="我的巡查计数" value={stats.count} helper="可在巡查页清零" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title="待巡查站点" value={stats.unchecked} helper="本轮尚未被领取的站点" />
          </Grid>
          {isAdmin ? (
            <>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard title="异常站点" value={stats.abnormal} helper="状态为 WAIT，待维护组处理" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard title="机器误报" value={stats.checkError} helper="巡查机器误判的站点" />
              </Grid>
            </>
          ) : null}
        </Grid>
      )}

      <Card className="mt-6 rounded-2xl bg-white/90 shadow-sm">
        <CardContent>
          <Typography variant="h6" className="font-semibold text-slate-900">
            快速操作
          </Typography>
          <Box className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button component={Link} to="/check" variant="contained" startIcon={<FactCheckRoundedIcon />} className="h-12">
              开始巡查
            </Button>
            <Button component={Link} to="/records" variant="outlined" startIcon={<ReceiptLongRoundedIcon />} className="h-12">
              操作日志
            </Button>
            {isAdmin ? (
              <Button component={Link} to="/manage" variant="outlined" startIcon={<ReportProblemRoundedIcon />} className="h-12">
                异常管理
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default DashboardPage

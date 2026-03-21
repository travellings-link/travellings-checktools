import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/client'
import StatCard from '../components/StatCard'

function pickNumber(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'number') return value
  }
  return 0
}

function DashboardPage() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/stats/overview')
        if (response.data?.success) {
          setStats(response.data.data || {})
        }
      } catch {
        setError('统计信息获取失败，请稍后再试。')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <Box>
      <Typography variant="h4" className="font-semibold text-slate-900">
        仪表盘
      </Typography>
      <Typography variant="body1" color="text.secondary" className="mt-1">
        统一查看巡查工作进度与效率。
      </Typography>

      {error ? (
        <Alert severity="error" className="mt-4">
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
            <StatCard title="站点总数量" value={pickNumber(stats, ['total_sites', 'totalSites'])} helper="系统内站点总量" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title="正常运行" value={pickNumber(stats, ['run_sites', 'runSites'])} helper="当前运行正常站点" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title="无徽标" value={pickNumber(stats, ['lost_sites', 'lostSites'])} helper="疑似徽标缺失站点" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="异常站点"
              value={
                pickNumber(stats, ['error_sites', 'errorSites']) +
                pickNumber(stats, ['wait_sites', 'waitSites']) +
                pickNumber(stats, ['timeout_sites', 'timeoutSites'])
              }
              helper="错误/等待/超时合计"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title="今日巡查" value={pickNumber(stats, ['today_checks', 'todayChecks'])} helper="当日巡查次数" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title="本周巡查" value={pickNumber(stats, ['week_checks', 'weekChecks'])} helper="近 7 天巡查次数" />
          </Grid>
        </Grid>
      )}

      <Card className="mt-6 rounded-2xl bg-white/90 shadow-sm">
        <CardContent>
          <Typography variant="h6" className="font-semibold text-slate-900">
            快速操作
          </Typography>
          <Box className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button
              component={Link}
              to="/check"
              variant="contained"
              startIcon={<FactCheckRoundedIcon />}
              className="h-12"
            >
              开始巡查
            </Button>
            <Button
              component={Link}
              to="/records"
              variant="outlined"
              startIcon={<ReceiptLongRoundedIcon />}
              className="h-12"
            >
              查看记录
            </Button>
            <Button
              component={Link}
              to="/reports"
              variant="outlined"
              startIcon={<SummarizeRoundedIcon />}
              className="h-12"
            >
              提交报告
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default DashboardPage

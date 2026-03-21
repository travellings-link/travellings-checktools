import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Fade,
  FormControl,
  FormControlLabel,
  FormLabel,
  LinearProgress,
  Link,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Typography
} from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api/client'

function getStatusColor(status) {
  if (status === 'RUN') return 'success'
  if (status === 'LOST') return 'warning'
  if (['ERROR', 'WAIT', 'TIMEOUT'].includes(status)) return 'error'
  if (status?.startsWith('4') || status?.startsWith('5')) return 'warning'
  return 'default'
}

function CheckPage() {
  const [currentSite, setCurrentSite] = useState(null)
  const [checkResult, setCheckResult] = useState('')
  const [checkNote, setCheckNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const [showFinishMessage, setShowFinishMessage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [siteSwitching, setSiteSwitching] = useState(false)
  const [noMoreSites, setNoMoreSites] = useState(false)
  const [renderKey, setRenderKey] = useState(0)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const currentSiteRef = useRef(null)

  useEffect(() => {
    currentSiteRef.current = currentSite
  }, [currentSite])

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchNextSite = useCallback(async () => {
    setSiteSwitching(Boolean(currentSiteRef.current))
    setLoading(true)
    setNoMoreSites(false)

    try {
      const response = await api.get('/sites/next')
      if (response.data?.success) {
        if (response.data.data && Object.keys(response.data.data).length > 0) {
          setCurrentSite(response.data.data)
          setRenderKey((key) => key + 1)
          setCheckResult('')
          setCheckNote('')
          setNoMoreSites(false)
        } else {
          setCurrentSite(null)
          setNoMoreSites(true)
        }
      } else {
        setCurrentSite(null)
        setNoMoreSites(true)
        showToast(response.data?.msg || '获取巡查任务失败', 'error')
      }
    } catch (error) {
      setCurrentSite(null)
      setNoMoreSites(true)
      showToast(error.response?.data?.msg || '获取巡查任务失败', 'error')
    } finally {
      setLoading(false)
      setSiteSwitching(false)
    }
  }, [showToast])

  const submitCheck = useCallback(async () => {
    if (!checkResult || !currentSite) return
    setSubmitting(true)
    try {
      await api.post('/sites/check', {
        web_id: currentSite.id,
        check_result: checkResult,
        check_note: checkNote
      })
      setCheckCount((count) => count + 1)
      showToast('提交成功')
      await fetchNextSite()
    } catch (error) {
      showToast(error.response?.data?.msg || '提交失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }, [checkResult, currentSite, checkNote, fetchNextSite, showToast])

  const skipSite = useCallback(async () => {
    await fetchNextSite()
  }, [fetchNextSite])

  const resetCheck = useCallback(() => {
    setShowFinishMessage(false)
    setCheckCount(0)
    setNoMoreSites(false)
    setCurrentSite(null)
    fetchNextSite()
  }, [fetchNextSite])

  useEffect(() => {
    fetchNextSite()
  }, [fetchNextSite])

  useEffect(() => {
    function handleKeyPress(event) {
      if (submitting || !currentSite) return

      if (event.key === '1') setCheckResult('正常')
      else if (event.key === '2') setCheckResult('异常')
      else if (event.key === '3') setCheckResult('误报')
      else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && checkResult) {
        event.preventDefault()
        submitCheck()
      } else if (event.key === 'Escape') {
        skipSite()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [checkResult, submitting, currentSite, submitCheck, skipSite])

  return (
    <Box className="mx-auto max-w-4xl">
      <Typography variant="h4" className="font-semibold text-slate-900">
        网站巡查
      </Typography>

      {loading && !currentSite && !showFinishMessage ? (
        <Card className="mt-5 rounded-2xl">
          <CardContent className="flex flex-col items-center py-10">
            <CircularProgress />
            <Typography color="text.secondary" className="mt-4">
              正在获取巡查任务...
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {noMoreSites && !currentSite && !showFinishMessage && !loading ? (
        <Card className="mt-5 rounded-2xl">
          <CardContent className="py-10 text-center">
            <Typography variant="h6">所有网站都已巡查完毕</Typography>
            <Typography color="text.secondary" className="mt-2">
              当前没有需要巡查的网站，请稍后再试。
            </Typography>
            <Button variant="contained" className="mt-4" onClick={resetCheck}>
              刷新
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {currentSite && !showFinishMessage ? (
        <Fade in timeout={220} key={renderKey}>
        <Card className="mt-5 overflow-hidden rounded-2xl">
          {siteSwitching ? <LinearProgress /> : null}
          <CardContent>
            <Typography variant="h5" className="font-semibold">
              {currentSite.name}
            </Typography>
            <Link href={currentSite.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1">
              {currentSite.link}
              <OpenInNewRoundedIcon fontSize="small" />
            </Link>
            <Box className="mt-3 flex items-center gap-2">
              <Typography variant="body2" color="text.secondary">
                状态:
              </Typography>
              <Chip label={currentSite.status || '未知'} color={getStatusColor(currentSite.status)} size="small" />
            </Box>

            {currentSite.failedReason ? (
              <Alert severity="error" className="mt-3">
                失败原因：{currentSite.failedReason}
              </Alert>
            ) : null}

            <Box className="mt-6">
              <FormControl>
                <FormLabel>巡查结果</FormLabel>
                <RadioGroup value={checkResult} onChange={(event) => setCheckResult(event.target.value)}>
                  <FormControlLabel value="正常" control={<Radio />} label="正常" />
                  <FormControlLabel value="异常" control={<Radio />} label="异常" />
                  <FormControlLabel value="误报" control={<Radio />} label="误报" />
                </RadioGroup>
              </FormControl>

              <TextField
                className="mt-4"
                label="备注（可选）"
                placeholder="请输入备注信息"
                fullWidth
                multiline
                rows={4}
                value={checkNote}
                onChange={(event) => setCheckNote(event.target.value)}
              />

              <Box className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="contained"
                  onClick={submitCheck}
                  disabled={!checkResult || submitting}
                  fullWidth
                >
                  提交并继续
                </Button>
                <Box className="flex w-full gap-2 sm:w-auto">
                  <Button variant="outlined" onClick={skipSite} disabled={submitting || siteSwitching} className="flex-1">
                    跳过
                  </Button>
                  <Button variant="outlined" onClick={() => setShowFinishMessage(true)} disabled={submitting || siteSwitching} className="flex-1">
                    完成
                  </Button>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" className="mt-3 block">
                快捷键：1=正常，2=异常，3=误报，Ctrl+Enter=提交，ESC=跳过
              </Typography>
            </Box>
          </CardContent>
        </Card>
        </Fade>
      ) : null}

      {checkCount > 0 ? (
        <Card className="mt-4 rounded-2xl">
          <CardContent className="text-center">
            <Typography>本次已巡查 {checkCount} 个网站</Typography>
          </CardContent>
        </Card>
      ) : null}

      {showFinishMessage ? (
        <Card className="mt-5 rounded-2xl">
          <CardContent className="py-10 text-center">
            <Typography variant="h5" className="font-semibold">
              巡查完成
            </Typography>
            <Typography className="mt-2">您本次共巡查了 {checkCount} 个网站</Typography>
            <Typography color="text.secondary">感谢您的辛勤工作。</Typography>
            <Button variant="contained" className="mt-4" onClick={resetCheck}>
              继续巡查
            </Button>
          </CardContent>
        </Card>
      ) : null}

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

export default CheckPage

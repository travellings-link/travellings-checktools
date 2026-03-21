import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <Box className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Typography variant="h2" className="font-bold text-slate-900">
        404
      </Typography>
      <Typography className="mt-2 text-slate-600">页面不存在或已迁移。</Typography>
      <Button component={Link} to="/" variant="contained" className="mt-6">
        返回首页
      </Button>
    </Box>
  )
}

export default NotFoundPage

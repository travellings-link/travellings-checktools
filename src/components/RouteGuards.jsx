import { Alert, Box, CircularProgress } from '@mui/material'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

export function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <Alert severity="warning" className="mt-6">
        当前账号没有管理员权限。
      </Alert>
    )
  }

  return children
}

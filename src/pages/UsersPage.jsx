import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import api, { call, errorMessage, listOf } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { githubAvatar } from '../utils/avatar'
import { formatTime } from '../utils/time'

// 用户由 GitHub 首次登录时自动创建；后端没有增删改接口，角色需直接改库 checktoolusers.role。
function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const body = await call(api.get('/users/all'))
      setUsers(listOf(body))
    } catch (error) {
      setToast({ open: true, message: errorMessage(error, '获取用户列表失败') })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <Box className="mx-auto max-w-5xl">
      <Typography variant="h4" className="font-semibold text-slate-900">
        用户列表
      </Typography>
      <Alert severity="info" className="mt-4">
        成员首次使用 GitHub 登录后会自动出现在这里，默认是巡查组。调整为维护组需在数据库中把该用户的 role 改为 1，并让其重新登录。
      </Alert>

      <Card className="mt-4 rounded-2xl">
        <CardContent>
          {loading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Typography color="text.secondary" className="py-8 text-center">
              暂无用户
            </Typography>
          ) : (
            <Box className="overflow-x-auto">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>GitHub 账号</TableCell>
                    <TableCell>角色</TableCell>
                    <TableCell align="right">巡查计数</TableCell>
                    <TableCell>最后登录</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((item) => (
                    <TableRow key={item.name} hover selected={item.name === user?.name}>
                      <TableCell>
                        <Box className="flex items-center gap-2">
                          <Avatar src={githubAvatar(item.name)} className="h-7 w-7 text-xs" sx={{ bgcolor: '#CEB0A1' }}>
                            {item.name.slice(0, 1).toUpperCase()}
                          </Avatar>
                          {item.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.role === 1 ? '维护组' : '巡查组'}
                          color={item.role === 1 ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatTime(item.lastLogin, '从未登录')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar open={toast.open} autoHideDuration={2600} onClose={() => setToast({ open: false, message: '' })}>
        <Alert severity="error" variant="filled" onClose={() => setToast({ open: false, message: '' })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default UsersPage

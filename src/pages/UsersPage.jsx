import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import api from '../api/client'

function formatTime(timeStr) {
  if (!timeStr) return '从未登录'
  return new Date(timeStr).toLocaleString('zh-CN')
}

function UsersPage() {
  const { user } = useAuth()
  const currentUserId = useMemo(() => user?.id, [user])

  const [users, setUsers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 0 })
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/users/list')
      if (response.data?.success) {
        setUsers(response.data.data || [])
      }
    } catch {
      showToast('获取用户列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function addUser(event) {
    event.preventDefault()
    if (!newUser.email) {
      showToast('请输入邮箱', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/users/add', newUser)
      showToast('用户添加成功')
      setShowAddForm(false)
      setNewUser({ email: '', password: '', role: 0 })
      fetchUsers()
    } catch (error) {
      showToast(error.response?.data?.msg || '添加失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleUserStatus(targetUser) {
    try {
      await api.put(`/users/${targetUser.id}/update`, {
        isActive: !targetUser.isActive
      })
      showToast('操作成功')
      fetchUsers()
    } catch (error) {
      showToast(error.response?.data?.msg || '操作失败', 'error')
    }
  }

  async function editUser(targetUser) {
    const password = window.prompt('请输入新密码（留空则不修改）:')
    if (password === null) return

    const roleRaw = window.prompt('请输入角色（0: 巡查组, 1: 维护组）:', String(targetUser.role ?? 0))
    if (roleRaw === null) return

    try {
      await api.put(`/users/${targetUser.id}/update`, {
        password: password || undefined,
        role: Number(roleRaw)
      })
      showToast('更新成功')
      fetchUsers()
    } catch (error) {
      showToast(error.response?.data?.msg || '更新失败', 'error')
    }
  }

  return (
    <Box className="mx-auto max-w-6xl">
      <Typography variant="h4" className="font-semibold text-slate-900">
        用户管理
      </Typography>

      <Box className="mt-4">
        <Button variant="contained" onClick={() => setShowAddForm((open) => !open)}>
          {showAddForm ? '取消添加' : '添加用户'}
        </Button>
      </Box>

      {showAddForm ? (
        <Card className="mt-4 rounded-2xl">
          <CardContent>
            <Typography variant="h6" className="font-semibold">
              添加新用户
            </Typography>
            <Box component="form" className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={addUser}>
              <TextField
                required
                label="邮箱"
                type="email"
                value={newUser.email}
                onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
              />
              <TextField
                label="密码（可选）"
                type="password"
                value={newUser.password}
                onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
              />
              <TextField
                select
                label="角色"
                value={newUser.role}
                onChange={(event) => setNewUser((prev) => ({ ...prev, role: Number(event.target.value) }))}
              >
                <MenuItem value={0}>巡查组成员</MenuItem>
                <MenuItem value={1}>维护组成员</MenuItem>
              </TextField>
              <Box className="md:col-span-2 flex gap-2">
                <Button type="submit" variant="contained" disabled={submitting}>
                  添加
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewUser({ email: '', password: '', role: 0 })
                  }}
                >
                  取消
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4 rounded-2xl">
        <CardContent>
          {loading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress />
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>邮箱</TableCell>
                    <TableCell>角色</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>最后登录</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.role === 1 ? '维护组' : '巡查组'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.isActive ? '活跃' : '禁用'}
                          color={item.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{formatTime(item.lastLogin)}</TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => editUser(item)}>
                          编辑
                        </Button>
                        {item.id !== currentUserId ? (
                          <Button size="small" onClick={() => toggleUserStatus(item)}>
                            {item.isActive ? '禁用' : '启用'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

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

export default UsersPage

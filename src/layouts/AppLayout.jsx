import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded'
import md5 from 'md5'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const drawerWidth = 260

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    const email = (user?.email || '').trim().toLowerCase()
    if (!email) {
      setAvatarUrl('')
      return
    }

    const emailHash = md5(email)
    setAvatarUrl(`https://cravatar.cn/avatar/${emailHash}?s=80&d=identicon`)
  }, [user?.email])

  const navItems = useMemo(() => {
    const items = [
      { label: '仪表盘', path: '/', icon: <DashboardRoundedIcon /> },
      { label: '巡查任务', path: '/check', icon: <FactCheckRoundedIcon /> },
      { label: '巡查记录', path: '/records', icon: <ReceiptLongRoundedIcon /> },
      { label: '提交报告', path: '/reports', icon: <SummarizeRoundedIcon /> }
    ]

    if (isAdmin) {
      items.push({ label: '用户管理', path: '/users', icon: <PeopleRoundedIcon /> })
    }

    return items
  }, [isAdmin])

  const drawerContent = (
    <Box className="flex h-full flex-col bg-white/80 backdrop-blur">
      <Box className="px-4 py-5">
        <Box className="flex items-center gap-2">
          <Box
            component="img"
            src="/icon.webp"
            alt="Travellings Check-Tool"
            className="h-7 w-7 rounded-md"
          />
          <Typography variant="h6" className="font-semibold" sx={{ color: '#A2CCCE' }}>
            Travellings
            <br />
            Check-Tool
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          开往巡查工具
        </Typography>
      </Box>
      <Divider />
      <List className="px-2 py-3">
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
            className="mb-1 rounded-xl"
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box className="mt-auto px-4 py-4">
        <Button
          fullWidth
          variant="outlined"
          sx={{
            color: '#c2410c',
            borderColor: '#fb923c',
            '&:hover': {
              borderColor: '#9a3412',
              backgroundColor: 'rgba(194, 65, 12, 0.08)'
            }
          }}
          onClick={() => {
            navigate('/auth-transition?type=logout')
          }}
        >
          退出登录
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box className="min-h-screen">
      <AppBar position="fixed" color="inherit" elevation={0} className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} className="mr-2 lg:hidden">
            <MenuRoundedIcon />
          </IconButton>
          <Typography variant="h6" className="font-semibold text-slate-900">
            开往巡查系统
          </Typography>
          <Box className="ml-auto flex items-center gap-2">
            <Avatar src={avatarUrl || undefined} className="h-8 w-8 text-sm" sx={{ bgcolor: '#CEB0A1' }}>
              {(user?.email || 'U').slice(0, 1).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary" className="hidden sm:block">
              {user?.email || '未登录'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" className="lg:w-[260px]" sx={{ flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ ml: { lg: `${drawerWidth}px` } }}
        className="px-4 pb-6 pt-24 sm:px-6 lg:px-10"
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppLayout

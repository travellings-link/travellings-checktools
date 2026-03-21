import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#A2CCCE'
    },
    secondary: {
      main: '#CEB0A1'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
  }
})

export default theme

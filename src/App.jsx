import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import AppLayout from './layouts/AppLayout'
import CheckPage from './pages/CheckPage'
import DashboardPage from './pages/DashboardPage'
import AuthTransitionPage from './pages/AuthTransitionPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RecordsPage from './pages/RecordsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth-transition" element={<AuthTransitionPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="check" element={<CheckPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

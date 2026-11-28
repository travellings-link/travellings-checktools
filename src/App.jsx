import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import AppLayout from './layouts/AppLayout'
import CheckPage from './pages/CheckPage'
import DashboardPage from './pages/DashboardPage'
import AuthTransitionPage from './pages/AuthTransitionPage'
import LoginPage from './pages/LoginPage'
import ManagePage from './pages/ManagePage'
import NonRunReviewPage from './pages/NonRunReviewPage'
import NotFoundPage from './pages/NotFoundPage'
import RecordsPage from './pages/RecordsPage'
import RunReviewPage from './pages/RunReviewPage'
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
        {/* 规则修订专题 · 非 RUN 倒查；专题结束后连同页面一起删除 */}
        <Route
          path="non-run-review"
          element={
            <RequireAdmin>
              <NonRunReviewPage />
            </RequireAdmin>
          }
        />
        {/* 规则修订专题 · RUN 站点倒查；专题结束后连同页面一起删除 */}
        <Route
          path="run-review"
          element={
            <RequireAdmin>
              <RunReviewPage />
            </RequireAdmin>
          }
        />
        <Route
          path="manage"
          element={
            <RequireAdmin>
              <ManagePage />
            </RequireAdmin>
          }
        />
        <Route
          path="users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        {/* 后端没有报告功能，旧书签统一回到首页 */}
        <Route path="reports" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

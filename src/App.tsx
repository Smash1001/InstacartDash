import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAccess } from './components/RequireAccess'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import Dashboard from './pages/Dashboard'

/** Site root: admins go to the admin panel, everyone else to the TV view. */
function HomeRedirect() {
  const { loading, session, role } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <RequireAccess>
                <Dashboard />
              </RequireAccess>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAccess adminOnly>
                <AdminPanel />
              </RequireAccess>
            }
          />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

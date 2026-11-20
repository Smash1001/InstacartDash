import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAccess } from './components/RequireAccess'
import { AuthProvider } from './hooks/useAuth'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import Dashboard from './pages/Dashboard'

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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

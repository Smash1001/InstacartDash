import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full place-items-center bg-slate-950 p-6 text-center text-slate-200">
      <div className="max-w-md space-y-4">{children}</div>
    </div>
  )
}

const linkBtn =
  'inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20'

/**
 * Gate a route behind sign-in. `adminOnly` additionally requires the admin role.
 * Viewers and admins can both see the dashboard.
 */
export function RequireAccess({ adminOnly = false, children }: { adminOnly?: boolean; children: ReactNode }) {
  const { loading, session, role, roleError } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Screen>
        <p className="text-slate-400">Loading…</p>
      </Screen>
    )
  }

  if (!session) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (roleError) {
    return (
      <Screen>
        <p className="text-lg font-semibold">Can’t reach the server</p>
        <p className="text-sm text-slate-400">Retrying automatically… ({roleError})</p>
      </Screen>
    )
  }

  if (!role || (adminOnly && role !== 'admin')) {
    return (
      <Screen>
        <p className="text-lg font-semibold">
          {role ? 'This page is for admins only' : 'Your account doesn’t have access yet'}
        </p>
        <p className="text-sm text-slate-400">
          Signed in as {session.user.email}.{' '}
          {role ? '' : 'Ask a store admin to grant you access.'}
        </p>
        <div className="flex justify-center gap-2">
          {role && (
            <Link to="/dashboard" className={linkBtn}>
              Go to dashboard
            </Link>
          )}
          <button type="button" className={linkBtn} onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </Screen>
    )
  }

  return children
}

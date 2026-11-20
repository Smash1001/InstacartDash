import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Role } from '../types'
import { getMyRole, getSession, onAuthChange } from '../services/authService'

interface AuthState {
  /** True until the session and role are known. */
  loading: boolean
  session: Session | null
  role: Role | null
  /** Set if the role lookup failed (e.g. network) — retried automatically. */
  roleError: string | null
}

const AuthContext = createContext<AuthState>({
  loading: true,
  session: null,
  role: null,
  roleError: null,
})

const ROLE_RETRY_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [role, setRole] = useState<{ userId: string; role: Role | null } | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      setSessionLoaded(true)
    })
    // Don't call Supabase inside this callback; just record the session.
    return onAuthChange((s) => {
      setSession(s)
      setSessionLoaded(true)
    })
  }, [])

  const userId = session?.user.id ?? null

  // Look up the role whenever the signed-in user changes (not on token refresh).
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      try {
        const r = await getMyRole(userId)
        if (cancelled) return
        setRole({ userId, role: r })
        setRoleError(null)
      } catch (e) {
        if (cancelled) return
        setRoleError(e instanceof Error ? e.message : 'Could not load your access level')
        timer = setTimeout(load, ROLE_RETRY_MS)
      }
    }
    load()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [userId])

  const roleKnown = role !== null && role.userId === userId
  const value: AuthState = {
    loading: !sessionLoaded || (!!userId && !roleKnown && !roleError),
    session,
    role: roleKnown ? role.role : null,
    roleError: userId ? roleError : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

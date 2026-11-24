import type { Session } from '@supabase/supabase-js'
import type { Role } from '../types'
import { supabase } from '../lib/supabase'

/**
 * The last email used to sign in, kept so the login form can pre-fill it.
 * Not prefixed "sb-", so sign-out leaves it alone. Passwords are never stored
 * by the app — the browser's password manager handles those.
 */
const LAST_EMAIL_KEY = 'leaderboard:last-email'

export function getRememberedEmail(): string {
  try {
    return window.localStorage.getItem(LAST_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const cleanEmail = email.trim()
  const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message,
    )
  }
  try {
    window.localStorage.setItem(LAST_EMAIL_KEY, cleanEmail)
  } catch {
    // Storage unavailable (private mode) — just don't remember it.
  }
}

/** Remove any Supabase auth data (session, refresh token) kept by the browser. */
function clearStoredAuth() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    for (const key of Object.keys(store)) {
      if (key.startsWith('sb-')) store.removeItem(key)
    }
  }
}

/**
 * Sign out completely:
 *  1. revoke this device's session on the server ('local' scope, so the TV
 *     account isn't also signed out on other screens),
 *  2. wipe stored auth data even if the network call failed (the remembered
 *     email and the browser's saved passwords are kept),
 *  3. hard-navigate to /login, *replacing* the current history entry and
 *     discarding all in-memory app state.
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Offline or server error — still clear everything locally below.
  }
  clearStoredAuth()
  window.location.replace('/login')
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session))
  return () => data.subscription.unsubscribe()
}

/** The signed-in user's role, or null if they have no profile (no access). */
export async function getMyRole(userId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.role as Role | undefined) ?? null
}

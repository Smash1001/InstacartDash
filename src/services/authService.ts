import type { Session } from '@supabase/supabase-js'
import type { Role } from '../types'
import { supabase } from '../lib/supabase'

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message,
    )
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
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

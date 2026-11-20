import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { errorMessage, inputClass } from '../lib/ui'
import { signIn } from '../services/authService'
import { Button } from '../components/ui'

/** Only allow same-app relative redirects. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

export default function AdminLogin() {
  const { loading, session, role } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session && !loading) {
    const fallback = role === 'admin' ? '/admin' : '/dashboard'
    return <Navigate to={safeNext(params.get('next')) ?? fallback} replace />
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
      // AuthProvider picks up the session; the redirect above takes over.
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-slate-50 p-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Instacart Runner Leaderboard
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Sign in</h1>
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            className={`${inputClass} w-full`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className={`${inputClass} w-full`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}

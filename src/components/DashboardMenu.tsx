import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'

const HIDE_AFTER_MS = 3000

/**
 * Small corner menu that appears only when the mouse moves (or the screen is
 * tapped), then hides again — so the TV view stays free of controls.
 */
export function DashboardMenu() {
  const { role } = useAuth()
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const show = () => {
      setVisible(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS)
    }
    window.addEventListener('mousemove', show)
    window.addEventListener('touchstart', show)
    window.addEventListener('keydown', show)
    return () => {
      window.removeEventListener('mousemove', show)
      window.removeEventListener('touchstart', show)
      window.removeEventListener('keydown', show)
      clearTimeout(timer.current)
    }
  }, [])

  const btn =
    'rounded-lg bg-slate-900/90 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-slate-800'

  return (
    <div
      className={`fixed right-3 top-3 z-50 flex gap-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {role === 'admin' && (
        <Link to="/admin" className={btn}>
          Admin panel
        </Link>
      )}
      <button type="button" className={btn} onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  )
}

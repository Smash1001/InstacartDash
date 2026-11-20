import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type AdminTab = 'performance' | 'runners' | 'announcement'

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'performance', label: 'Weekly performance' },
  { id: 'runners', label: 'Runners' },
  { id: 'announcement', label: 'Announcement' },
]

export function AdminNavigation({
  active,
  onChange,
  actions,
}: {
  active: AdminTab
  onChange: (tab: AdminTab) => void
  actions?: ReactNode
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Admin</p>
          <h1 className="text-lg font-bold text-slate-900">Runner Leaderboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            target="_blank"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Open TV view ↗
          </Link>
          {actions}
        </div>
      </div>
      <nav className="mx-auto mt-2 flex max-w-5xl gap-1 overflow-x-auto px-4" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-current={active === t.id ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              active === t.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

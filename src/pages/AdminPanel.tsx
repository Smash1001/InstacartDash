import { Link } from 'react-router-dom'
import { AnnouncementEditor } from '../components/admin/AnnouncementEditor'
import { RunnerEditor } from '../components/admin/RunnerEditor'
import { WeekBar } from '../components/admin/WeekBar'
import { Button, Notice } from '../components/ui'
import { useAdminEditor } from '../hooks/useAdminEditor'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'

/** Single-page admin: week, runners + IPS, and announcement, saved together. */
export default function AdminPanel() {
  const { session } = useAuth()
  const ed = useAdminEditor()

  const activeRunners = ed.runners.filter((r) => r.is_active)
  const measuredCount = activeRunners.filter((r) => ed.records.has(r.id)).length

  return (
    <div className="min-h-full bg-board pb-24">
      <header className="border-b border-ink/10 bg-board-light">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Admin</p>
            <h1 className="text-lg font-bold text-slate-900">Runner Leaderboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Open TV view
            </Link>
            <span className="hidden text-sm text-slate-500 sm:inline">{session?.user.email}</span>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
        <WeekBar
          week={ed.week}
          onChangeWeek={ed.changeWeek}
          displayWeek={ed.settings?.display_week_start ?? null}
          onShowOnTv={ed.showOnTv}
          measuredCount={measuredCount}
          activeCount={activeRunners.length}
        />

        {ed.loading && !ed.runners.length ? (
          <p className="rounded-xl bg-board-light p-6 text-sm text-slate-600 ring-1 ring-ink/10">Loading…</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <RunnerEditor
              runners={ed.runners}
              records={ed.records}
              drafts={ed.drafts}
              newRows={ed.newRows}
              errors={ed.errors}
              isRunnerDirty={ed.isRunnerDirty}
              onDraft={ed.setDraft}
              onAddRow={ed.addNewRow}
              onUpdateNewRow={ed.updateNewRow}
              onRemoveNewRow={ed.removeNewRow}
            />
            <div className="lg:sticky lg:top-4">
              <AnnouncementEditor
                value={ed.announcement}
                onChange={ed.setAnnouncement}
                lastPublished={ed.settings?.updated_at}
                error={ed.errors.announcement}
                dirty={ed.settings !== null && ed.announcement.trim() !== ed.settings.announcement}
              />
            </div>
          </div>
        )}
      </main>

      {/* One save bar for everything on the page */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/10 bg-board-light/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            {ed.notice && !(ed.notice.kind === 'success' && ed.changeCount) ? (
              <Notice notice={ed.notice} />
            ) : (
              <p className="text-sm text-slate-600">
                {ed.changeCount
                  ? `${ed.changeCount} unsaved change${ed.changeCount === 1 ? '' : 's'}`
                  : 'No unsaved changes'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={!ed.changeCount || ed.saving} onClick={ed.discard}>
              Discard
            </Button>
            <Button variant="primary" disabled={!ed.changeCount || ed.saving} onClick={ed.saveAll}>
              {ed.saving ? 'Saving…' : 'Save all changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { DashboardMenu } from '../components/DashboardMenu'
import { Leaderboard } from '../components/Leaderboard'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { formatWeekRange } from '../lib/week'
import { STORE_NAME } from '../config'

const STATUS_STYLE = {
  live: { dot: 'bg-emerald-600', label: 'Live' },
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Connecting…' },
  offline: { dot: 'bg-rose-500 animate-pulse', label: 'Reconnecting…' },
} as const

/** Full-screen, read-only TV view. No editing controls. */
export default function Dashboard() {
  const { data, error, connection } = useLeaderboard()
  const status = STATUS_STYLE[error ? 'offline' : connection]

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-board text-ink">
      <DashboardMenu />
      <header className="flex shrink-0 items-end justify-between gap-[2vw] border-b border-ink/15 px-[3vw] pb-[2vh] pt-[3vh]">
        <div className="min-w-0">
          <p className="truncate text-[clamp(0.8rem,1.15vw,1.5rem)] font-semibold uppercase tracking-[0.3em] text-emerald-700">
            {STORE_NAME}
          </p>
          <h1 className="mt-[0.5vh] text-[clamp(1.75rem,3.4vw,4.25rem)] font-black leading-none tracking-tight">
            Instacart Runner Leaderboard
          </h1>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[clamp(0.7rem,0.95vw,1.2rem)] font-semibold uppercase tracking-widest text-slate-600">
            Week of
          </p>
          <p className="text-[clamp(1.1rem,2.1vw,2.6rem)] font-extrabold leading-tight">
            {data ? formatWeekRange(data.weekStart) : '—'}
          </p>
          <div className="mt-[0.8vh] flex items-center justify-end gap-[1.2vw] text-[clamp(0.75rem,1vw,1.25rem)]">
            {data && (
              <span className="rounded-full bg-ink/10 px-[0.9vw] py-[0.3vh] font-semibold text-slate-800">
                {data.measuredRunnerCount} of {data.activeRunnerCount} updated
              </span>
            )}
            <span className="flex items-center gap-[0.4vw] text-slate-600">
              <span className={`inline-block size-[0.7em] rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 py-[2vh]">
        {data ? (
          <Leaderboard entries={data.entries} />
        ) : (
          <div className="grid h-full place-items-center text-[clamp(1.25rem,2vw,2.5rem)] text-slate-600">
            {error ? 'Unable to load leaderboard. Retrying…' : 'Loading leaderboard…'}
          </div>
        )}
      </main>

      <AnnouncementBanner text={data?.announcement ?? ''} lastUpdated={data?.lastUpdated ?? null} />
    </div>
  )
}

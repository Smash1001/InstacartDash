import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { DashboardMenu } from '../components/DashboardMenu'
import { Leaderboard } from '../components/Leaderboard'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { formatWeekRange } from '../lib/week'
import { formatTimestamp } from '../lib/format'
import { STORE_NAME } from '../config'

/** Full-screen, read-only TV view. No editing controls. */
export default function Dashboard() {
  const { data, error } = useLeaderboard()

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
          <p className="mb-[1vh] text-[clamp(0.7rem,0.85vw,1.05rem)] font-medium text-slate-600">
            Last updated{' '}
            <span className="font-semibold text-slate-700">
              {formatTimestamp(data?.lastUpdated ?? null)}
            </span>
          </p>
          <p className="text-[clamp(0.7rem,0.95vw,1.2rem)] font-semibold uppercase tracking-widest text-slate-600">
            Week of
          </p>
          <p className="text-[clamp(1.1rem,2.1vw,2.6rem)] font-extrabold leading-tight">
            {data ? formatWeekRange(data.weekStart) : '—'}
          </p>
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

      <AnnouncementBanner text={data?.announcement ?? ''} />
    </div>
  )
}

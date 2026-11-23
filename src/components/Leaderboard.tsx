import type { RankedRunner } from '../types'
import { LEADERBOARD_COLUMNS, RunnerRow } from './RunnerRow'

/** Never make rows taller than 1/MIN_ROWS of the area, even with few runners. */
const MIN_ROWS = 10

export function Leaderboard({ entries }: { entries: RankedRunner[] }) {
  if (entries.length === 0) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="text-[clamp(1.5rem,3vw,3.5rem)] font-bold text-slate-700">No IPS entered yet</p>
          <p className="mt-2 text-[clamp(1rem,1.5vw,1.75rem)] text-slate-600">
            Rankings will appear as this week’s numbers are added.
          </p>
        </div>
      </div>
    )
  }

  const rowCount = Math.max(entries.length, MIN_ROWS)

  return (
    <div className="flex h-full flex-col">
      <div
        className={`${LEADERBOARD_COLUMNS} px-[3vw] pb-[1vh] text-[clamp(0.7rem,1vw,1.25rem)] font-semibold uppercase tracking-widest text-slate-600`}
      >
        <span className="text-center">#</span>
        <span>Runner</span>
        <span className="text-right">IPS · 7 days</span>
        <span className="text-right">IPS · 30 days</span>
      </div>
      {/* Size container: rows use cqh units to divide its height evenly. */}
      <ol className="min-h-0 flex-1 overflow-hidden [container-type:size]">
        {entries.map((e, i) => (
          <RunnerRow key={e.id} entry={e} index={i} rowCount={rowCount} />
        ))}
      </ol>
    </div>
  )
}

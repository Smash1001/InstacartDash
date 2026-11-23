import type { CSSProperties } from 'react'
import type { RankedRunner } from '../types'
import { formatIps } from '../lib/format'

/** Shared column layout for the header row and every runner row. */
export const LEADERBOARD_COLUMNS = 'grid grid-cols-[7%_minmax(0,1fr)_17%_17%] items-center gap-x-[1.5vw]'

const MEDALS: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  3: 'bg-gradient-to-br from-orange-400 to-orange-700 text-orange-50',
}

export function RunnerRow({
  entry,
  index,
  rowCount,
}: {
  entry: RankedRunner
  /** Position in the list, for alternating shades */
  index: number
  /** Number of row slots the list is divided into */
  rowCount: number
}) {
  // Each row is 1/rowCount of the list height (container query units), and the
  // text scales with the row — capped so a short list doesn't get huge text.
  const style: CSSProperties = {
    height: `calc(100cqh / ${rowCount})`,
    fontSize: `min(calc(100cqh / ${rowCount} * 0.6), 2.8vw)`,
  }
  const medal = MEDALS[entry.rank]

  return (
    <li
      className={`${LEADERBOARD_COLUMNS} px-[3vw] ${index % 2 === 0 ? 'bg-board-light' : 'bg-board-dark'}`}
      style={style}
    >
      <span className="flex justify-center" aria-label={`Rank ${entry.rank}${entry.tied ? ' (tied)' : ''}`}>
        {medal ? (
          <span
            className={`grid size-[1.45em] place-items-center rounded-full text-[0.8em] font-black tabular-nums ${medal}`}
          >
            {entry.rank}
          </span>
        ) : (
          <span className="font-bold tabular-nums text-slate-600">{entry.rank}</span>
        )}
      </span>

      <span className="truncate font-bold text-ink">
        {entry.name}
        {entry.tied && (
          <span className="ml-[0.5em] rounded bg-ink/10 px-[0.4em] py-[0.05em] align-middle text-[0.45em] font-semibold uppercase tracking-wider text-slate-700">
            Tie
          </span>
        )}
      </span>

      <span className="text-right font-black tabular-nums text-emerald-800">{formatIps(entry.ips7d)}</span>
      <span className="text-right font-bold tabular-nums text-slate-700">{formatIps(entry.ips30d)}</span>
    </li>
  )
}

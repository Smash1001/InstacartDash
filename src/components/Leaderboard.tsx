import type { CSSProperties } from 'react'
import type { RankedRunner } from '../types'
import { RunnerRow, type RowDensity } from './RunnerRow'

/** Never make rows taller than 1/MIN_ROWS of the area, even with few runners. */
const MIN_ROWS = 7

function layoutFor(count: number): { columns: number; density: RowDensity } {
  if (count <= 8) return { columns: 1, density: 'large' }
  if (count <= 18) return { columns: 2, density: 'medium' }
  return { columns: 3, density: 'small' }
}

export function Leaderboard({ entries }: { entries: RankedRunner[] }) {
  if (entries.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-3xl border-2 border-dashed border-white/10">
        <div className="text-center">
          <p className="text-[clamp(1.5rem,3vw,3.5rem)] font-bold text-slate-300">
            No times entered yet
          </p>
          <p className="mt-2 text-[clamp(1rem,1.5vw,1.75rem)] text-slate-500">
            Rankings will appear as this week’s averages are added.
          </p>
        </div>
      </div>
    )
  }

  const { columns, density } = layoutFor(entries.length)
  // Balance columns (9 runners -> 5 + 4), but cap row height by only using
  // a fraction of the available height when there are few rows.
  const rows = Math.ceil(entries.length / columns)
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    height: `${Math.min(1, rows / MIN_ROWS) * 100}%`,
  }

  // Column-major flow so rank reads top-to-bottom, then the next column.
  return (
    <ol className="grid grid-flow-col gap-x-[2vw] gap-y-[1.1vh]" style={style}>
      {entries.map((e) => (
        <RunnerRow key={e.id} entry={e} density={density} />
      ))}
    </ol>
  )
}

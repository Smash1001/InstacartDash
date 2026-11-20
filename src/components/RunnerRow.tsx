import type { RankedRunner } from '../types'
import { formatSeconds } from '../lib/format'

const MEDALS: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-amber-200/60',
  2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 ring-slate-100/60',
  3: 'bg-gradient-to-br from-orange-400 to-orange-700 text-orange-50 ring-orange-300/50',
}

const ROW_ACCENT: Record<number, string> = {
  1: 'border-amber-400/60 bg-amber-400/10',
  2: 'border-slate-300/40 bg-slate-300/[0.07]',
  3: 'border-orange-500/50 bg-orange-500/[0.08]',
}

export type RowDensity = 'large' | 'medium' | 'small'

const SIZES: Record<RowDensity, { badge: string; name: string; time: string; unit: string }> = {
  large: {
    badge: 'size-[clamp(2.75rem,4.6vw,6rem)] text-[clamp(1.25rem,2.4vw,3rem)]',
    name: 'text-[clamp(1.25rem,2.6vw,3.25rem)]',
    time: 'text-[clamp(1.5rem,3vw,3.75rem)]',
    unit: 'text-[clamp(0.75rem,1.1vw,1.4rem)]',
  },
  medium: {
    badge: 'size-[clamp(2.25rem,3.4vw,4.5rem)] text-[clamp(1rem,1.8vw,2.25rem)]',
    name: 'text-[clamp(1rem,1.9vw,2.4rem)]',
    time: 'text-[clamp(1.1rem,2.2vw,2.75rem)]',
    unit: 'text-[clamp(0.7rem,0.9vw,1.1rem)]',
  },
  small: {
    badge: 'size-[clamp(1.75rem,2.5vw,3.25rem)] text-[clamp(0.85rem,1.3vw,1.6rem)]',
    name: 'text-[clamp(0.9rem,1.35vw,1.7rem)]',
    time: 'text-[clamp(1rem,1.6vw,2rem)]',
    unit: 'text-[clamp(0.6rem,0.75vw,0.95rem)]',
  },
}

export function RunnerRow({ entry, density }: { entry: RankedRunner; density: RowDensity }) {
  const s = SIZES[density]
  const medal = MEDALS[entry.rank]
  return (
    <li
      className={`flex min-h-0 items-center gap-[1.5vw] rounded-2xl border px-[1.5vw] ${
        ROW_ACCENT[entry.rank] ?? 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <span
        className={`grid shrink-0 place-items-center rounded-full font-black tabular-nums ring-2 ${s.badge} ${
          medal ?? 'bg-slate-800 text-slate-200 ring-white/10'
        }`}
        aria-label={`Rank ${entry.rank}${entry.tied ? ' (tied)' : ''}`}
      >
        {entry.rank}
      </span>

      <span className={`min-w-0 flex-1 truncate font-bold text-white ${s.name}`}>
        {entry.name}
        {entry.tied && (
          <span className="ml-[0.6vw] align-middle rounded-md bg-white/10 px-[0.5vw] py-[0.1vw] text-[0.45em] font-semibold uppercase tracking-wider text-slate-300">
            Tie
          </span>
        )}
      </span>

      <span className="shrink-0 text-right leading-none">
        <span className={`font-black tabular-nums text-emerald-300 ${s.time}`}>
          {formatSeconds(entry.avgSecondsPerItem)}
        </span>
        <span className={`ml-[0.4vw] font-medium text-slate-400 ${s.unit}`}>sec/item</span>
      </span>
    </li>
  )
}

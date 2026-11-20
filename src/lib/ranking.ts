import type { RankedRunner, Runner, WeeklyPerformance } from '../types'

/** Compare in hundredths so 4.1 and 4.10 are equal and floats don't drift. */
const toHundredths = (n: number) => Math.round(n * 100)

const byName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base' })

/**
 * Rank active runners that have a measurement for the week.
 * Lower average is better. Equal averages share a rank (RANK() semantics:
 * 1, 2, 2, 4) and are displayed in name order.
 * Runners without a measurement are excluded — they get no score.
 */
export function rankRunners(
  runners: Runner[],
  performance: WeeklyPerformance[],
  weekStart: string,
): RankedRunner[] {
  const avgByRunner = new Map<string, number>()
  for (const p of performance) {
    if (p.week_start === weekStart) {
      avgByRunner.set(p.runner_id, Number(p.avg_seconds_per_item))
    }
  }

  const rows = runners
    .filter((r) => r.is_active && avgByRunner.has(r.id))
    .map((r) => ({ id: r.id, name: r.name, avgSecondsPerItem: avgByRunner.get(r.id)! }))
    .sort(
      (a, b) =>
        toHundredths(a.avgSecondsPerItem) - toHundredths(b.avgSecondsPerItem) ||
        byName(a.name, b.name) ||
        a.id.localeCompare(b.id),
    )

  const countByScore = new Map<number, number>()
  for (const r of rows) {
    const k = toHundredths(r.avgSecondsPerItem)
    countByScore.set(k, (countByScore.get(k) ?? 0) + 1)
  }

  let rank = 0
  return rows.map((r, i) => {
    const k = toHundredths(r.avgSecondsPerItem)
    if (i === 0 || k !== toHundredths(rows[i - 1].avgSecondsPerItem)) rank = i + 1
    return { ...r, rank, tied: countByScore.get(k)! > 1 }
  })
}

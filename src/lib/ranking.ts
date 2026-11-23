import type { RankedRunner, Runner, WeeklyPerformance } from '../types'

const byName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base' })

/**
 * Rank active runners that have a 7-day IPS for the week.
 * Lower IPS is better. Equal values share a rank (RANK() semantics:
 * 1, 2, 2, 4) and are displayed in name order.
 * Runners without a measurement are excluded — they get no score.
 */
export function rankRunners(
  runners: Runner[],
  performance: WeeklyPerformance[],
  weekStart: string,
): RankedRunner[] {
  const perfByRunner = new Map<string, WeeklyPerformance>()
  for (const p of performance) {
    if (p.week_start === weekStart) perfByRunner.set(p.runner_id, p)
  }

  const rows = runners
    .filter((r) => r.is_active && perfByRunner.has(r.id))
    .map((r) => {
      const p = perfByRunner.get(r.id)!
      return {
        id: r.id,
        name: r.name,
        ips7d: Math.round(Number(p.ips_7d)),
        ips30d: p.ips_30d == null ? null : Math.round(Number(p.ips_30d)),
      }
    })
    .sort((a, b) => a.ips7d - b.ips7d || byName(a.name, b.name) || a.id.localeCompare(b.id))

  const countByScore = new Map<number, number>()
  for (const r of rows) countByScore.set(r.ips7d, (countByScore.get(r.ips7d) ?? 0) + 1)

  let rank = 0
  return rows.map((r, i) => {
    if (i === 0 || r.ips7d !== rows[i - 1].ips7d) rank = i + 1
    return { ...r, rank, tied: countByScore.get(r.ips7d)! > 1 }
  })
}

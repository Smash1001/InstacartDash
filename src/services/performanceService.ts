import type { WeeklyPerformance } from '../types'
import { isMonday } from '../lib/week'
import { backend } from './backend'

/** Matches a Postgres INTEGER, with a sane ceiling for typos. */
const MAX_IPS = 99_999

function assertWeek(weekStart: string) {
  if (!isMonday(weekStart)) throw new Error('Week must start on a Monday.')
}

/**
 * Parse admin input into a positive whole-number IPS.
 * Returns null for an empty box; throws a user-facing message if invalid.
 */
export function parseIps(raw: string): number | null {
  const s = raw.trim()
  if (s === '') return null
  if (!/^\d+$/.test(s)) throw new Error('Whole numbers only, e.g. 42')
  const n = Number(s)
  if (n <= 0) throw new Error('Must be greater than 0.')
  if (n > MAX_IPS) throw new Error('Value is too large.')
  return n
}

export function listPerformanceForWeek(weekStart: string): Promise<WeeklyPerformance[]> {
  assertWeek(weekStart)
  return backend.listPerformance(weekStart)
}

/** Create or update the runner's single record for that week. */
export function saveIps(
  runnerId: string,
  weekStart: string,
  ips7d: number,
  ips30d: number | null,
): Promise<WeeklyPerformance> {
  assertWeek(weekStart)
  const valid = (n: number) => Number.isInteger(n) && n > 0 && n <= MAX_IPS
  if (!valid(ips7d)) throw new Error('7-day IPS must be a positive whole number.')
  if (ips30d !== null && !valid(ips30d)) throw new Error('30-day IPS must be a positive whole number.')
  return backend.upsertPerformance(runnerId, weekStart, { ips_7d: ips7d, ips_30d: ips30d })
}

export function clearIps(runnerId: string, weekStart: string): Promise<void> {
  assertWeek(weekStart)
  return backend.deletePerformance(runnerId, weekStart)
}

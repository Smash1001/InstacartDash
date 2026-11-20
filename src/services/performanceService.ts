import type { WeeklyPerformance } from '../types'
import { isMonday } from '../lib/week'
import { backend } from './backend'

/** Matches NUMERIC(8,2): up to 999999.99 */
const MAX_AVG = 999999.99

function assertWeek(weekStart: string) {
  if (!isMonday(weekStart)) throw new Error('Week must start on a Monday.')
}

/**
 * Parse admin input into a positive average with at most two decimals.
 * Returns the number or throws a user-facing message.
 */
export function parseAverage(raw: string): number {
  const s = raw.trim()
  if (!/^\d*\.?\d+$/.test(s)) throw new Error('Enter a number, e.g. 4.25')
  const n = Number(s)
  if (!(n > 0)) throw new Error('Must be greater than 0.')
  if (n > MAX_AVG) throw new Error('Value is too large.')
  if (!/^\d*(\.\d{1,2})?$/.test(s)) throw new Error('Use at most 2 decimal places.')
  return n
}

export function listPerformanceForWeek(weekStart: string): Promise<WeeklyPerformance[]> {
  assertWeek(weekStart)
  return backend.listPerformance(weekStart)
}

/** Create or update the runner's single record for that week. */
export function saveAverage(
  runnerId: string,
  weekStart: string,
  avg: number,
): Promise<WeeklyPerformance> {
  assertWeek(weekStart)
  if (!(avg > 0) || avg > MAX_AVG) throw new Error('Average must be a positive number.')
  return backend.upsertPerformance(runnerId, weekStart, avg)
}

export function clearAverage(runnerId: string, weekStart: string): Promise<void> {
  assertWeek(weekStart)
  return backend.deletePerformance(runnerId, weekStart)
}

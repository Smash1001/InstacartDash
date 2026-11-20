// Week helpers. Weeks start on Monday and are represented as local
// calendar dates in YYYY-MM-DD form (matching a Postgres DATE column).

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as a local date (avoids UTC off-by-one). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday on or before the given date. */
export function getWeekStart(date: Date = new Date()): string {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return toISODate(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday),
  )
}

export function addWeeks(weekStart: string, n: number): string {
  const d = parseISODate(weekStart)
  d.setDate(d.getDate() + n * 7)
  return toISODate(d)
}

export function isMonday(s: string): boolean {
  if (!ISO_DATE.test(s)) return false
  const d = parseISODate(s)
  return toISODate(d) === s && d.getDay() === 1
}

const rangeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** e.g. "Nov 16 – 22, 2026" */
export function formatWeekRange(weekStart: string): string {
  const start = parseISODate(weekStart)
  const end = parseISODate(addWeeks(weekStart, 1))
  end.setDate(end.getDate() - 1)
  return rangeFormat.formatRange(start, end)
}

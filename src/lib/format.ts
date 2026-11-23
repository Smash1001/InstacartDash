/** IPS values are whole numbers. */
export function formatIps(n: number | null | undefined): string {
  return n == null ? '—' : String(Math.round(Number(n)))
}

const timestampFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—'
  return timestampFormat.format(new Date(iso))
}

/** Newest of a list of ISO timestamps. */
export function latest(...isoValues: (string | null | undefined)[]): string | null {
  let best: string | null = null
  let bestMs = -Infinity
  for (const v of isoValues) {
    if (!v) continue
    const ms = Date.parse(v)
    if (ms > bestMs) {
      bestMs = ms
      best = v
    }
  }
  return best
}

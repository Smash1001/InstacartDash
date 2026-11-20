import { useCallback, useEffect, useRef, useState } from 'react'
import type { LeaderboardData } from '../types'
import { latest } from '../lib/format'
import { rankRunners } from '../lib/ranking'
import { getDashboardSettings } from '../services/announcementService'
import { backend, type ConnectionStatus } from '../services/backend'
import { listPerformanceForWeek } from '../services/performanceService'
import { listRunners } from '../services/runnerService'

/** Safety-net refresh even if no realtime event arrives. */
const POLL_MS = 60_000
/** Collapse bursts of change events into one fetch. */
const DEBOUNCE_MS = 250

async function fetchLeaderboard(): Promise<LeaderboardData> {
  const settings = await getDashboardSettings()
  const weekStart = settings.display_week_start
  const [runners, performance] = await Promise.all([
    listRunners(),
    listPerformanceForWeek(weekStart),
  ])
  const entries = rankRunners(runners, performance, weekStart)
  return {
    weekStart,
    entries,
    activeRunnerCount: runners.filter((r) => r.is_active).length,
    measuredRunnerCount: entries.length,
    announcement: settings.announcement,
    lastUpdated: latest(settings.updated_at, ...performance.map((p) => p.updated_at)),
  }
}

/**
 * Loads the leaderboard, keeps it fresh via realtime notifications, and
 * re-fetches after reconnects, when the tab becomes visible, when the network
 * comes back, and on a slow poll. Last good data is kept on errors.
 */
export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connection, setConnection] = useState<ConnectionStatus>('connecting')
  const requestId = useRef(0)
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    try {
      const next = await fetchLeaderboard()
      if (id !== requestId.current) return // a newer request superseded this one
      setData(next)
      setError(null)
    } catch (e) {
      if (id !== requestId.current) return
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard')
    }
  }, [])

  const scheduleRefresh = useCallback(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(refresh, DEBOUNCE_MS)
  }, [refresh])

  useEffect(() => {
    refresh()

    let previous: ConnectionStatus = 'connecting'
    const unsubscribe = backend.subscribe(scheduleRefresh, (status) => {
      setConnection(status)
      // Anything may have changed while disconnected — resync on (re)connect.
      if (status === 'live' && previous !== 'live') scheduleRefresh()
      previous = status
    })

    const onOnline = () => scheduleRefresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleRefresh()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    const poll = setInterval(refresh, POLL_MS)

    return () => {
      unsubscribe()
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(poll)
      clearTimeout(debounce.current)
    }
  }, [refresh, scheduleRefresh])

  return { data, error, connection, refresh }
}

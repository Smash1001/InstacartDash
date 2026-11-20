import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js'
import type { DashboardSettings, Runner, WeeklyPerformance } from '../types'
import { supabase } from '../lib/supabase'
import type { DataBackend } from './backend'

const REALTIME_TABLES = ['runners', 'weekly_performance', 'dashboard_settings'] as const

/** Turn PostgREST errors into messages an admin can act on. */
function fail(error: PostgrestError): never {
  // .single() found no row — with RLS this almost always means "not allowed".
  if (error.code === 'PGRST116' || error.code === '42501') {
    throw new Error('You don’t have permission to make this change.')
  }
  if (error.code === '23514') throw new Error('That value isn’t allowed (check it’s positive and valid).')
  if (error.code === '23505') throw new Error('That record already exists.')
  throw new Error(error.message)
}

function unwrap<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T {
  if (error) fail(error)
  return data as T
}

const normalizePerf = (p: WeeklyPerformance): WeeklyPerformance => ({
  ...p,
  avg_seconds_per_item: Number(p.avg_seconds_per_item),
})

export const supabaseBackend: DataBackend = {
  async listRunners() {
    return unwrap(await supabase.from('runners').select('*')) as Runner[]
  },

  async createRunner(name) {
    return unwrap(await supabase.from('runners').insert({ name }).select().single()) as Runner
  },

  async updateRunner(id, patch) {
    return unwrap(
      await supabase.from('runners').update(patch).eq('id', id).select().single(),
    ) as Runner
  },

  async listPerformance(weekStart) {
    const rows = unwrap(
      await supabase.from('weekly_performance').select('*').eq('week_start', weekStart),
    ) as WeeklyPerformance[]
    return rows.map(normalizePerf)
  },

  async upsertPerformance(runnerId, weekStart, avg) {
    // updated_at / updated_by are set by a database trigger.
    const row = unwrap(
      await supabase
        .from('weekly_performance')
        .upsert(
          { runner_id: runnerId, week_start: weekStart, avg_seconds_per_item: avg },
          { onConflict: 'runner_id,week_start' },
        )
        .select()
        .single(),
    ) as WeeklyPerformance
    return normalizePerf(row)
  },

  async deletePerformance(runnerId, weekStart) {
    unwrap(
      await supabase
        .from('weekly_performance')
        .delete()
        .eq('runner_id', runnerId)
        .eq('week_start', weekStart),
    )
  },

  async getSettings() {
    return unwrap(
      await supabase.from('dashboard_settings').select('*').eq('id', 1).single(),
    ) as DashboardSettings
  },

  async updateSettings(patch) {
    return unwrap(
      await supabase.from('dashboard_settings').update(patch).eq('id', 1).select().single(),
    ) as DashboardSettings
  },

  subscribe(onChange, onStatus) {
    let stopped = false
    let current: RealtimeChannel | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    const connect = () => {
      onStatus('connecting')
      let channel = supabase.channel(`dashboard-${crypto.randomUUID()}`)
      for (const table of REALTIME_TABLES) {
        channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () =>
          onChange(),
        )
      }
      current = channel
      channel.subscribe((status) => {
        if (stopped || channel !== current) return // stale channel
        if (status === 'SUBSCRIBED') {
          attempt = 0
          onStatus('live')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          onStatus('offline')
          scheduleReconnect()
        }
      })
    }

    // Exponential backoff: 1s, 2s, 4s … capped at 30s.
    const scheduleReconnect = () => {
      if (retryTimer || stopped) return
      const delay = Math.min(30_000, 1000 * 2 ** attempt++)
      retryTimer = setTimeout(async () => {
        retryTimer = undefined
        const old = current
        current = null
        if (old) await supabase.removeChannel(old)
        if (!stopped) connect()
      }, delay)
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(retryTimer)
      if (current) supabase.removeChannel(current)
      current = null
    }
  },
}

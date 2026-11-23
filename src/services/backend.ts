import type { DashboardSettings, Runner, WeeklyPerformance } from '../types'
import { supabaseBackend } from './supabaseBackend'

export type ConnectionStatus = 'connecting' | 'live' | 'offline'

/**
 * Everything the UI needs from persistence. Services wrap this with
 * validation; components and hooks never talk to the backend directly.
 */
export interface DataBackend {
  listRunners(): Promise<Runner[]>
  createRunner(name: string): Promise<Runner>
  updateRunner(id: string, patch: { name?: string; is_active?: boolean }): Promise<Runner>

  listPerformance(weekStart: string): Promise<WeeklyPerformance[]>
  upsertPerformance(
    runnerId: string,
    weekStart: string,
    values: { ips_7d: number; ips_30d: number | null },
  ): Promise<WeeklyPerformance>
  deletePerformance(runnerId: string, weekStart: string): Promise<void>

  getSettings(): Promise<DashboardSettings>
  updateSettings(patch: {
    announcement?: string
    display_week_start?: string
  }): Promise<DashboardSettings>

  /** Notify on any data change. Returns an unsubscribe function. */
  subscribe(onChange: () => void, onStatus: (s: ConnectionStatus) => void): () => void
}

export const backend: DataBackend = supabaseBackend

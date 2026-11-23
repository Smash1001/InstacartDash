/** Mirrors public.runners */
export interface Runner {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

/** Mirrors public.weekly_performance */
export interface WeeklyPerformance {
  id: string
  runner_id: string
  /** Monday of the week, YYYY-MM-DD */
  week_start: string
  /** IPS over the last 7 days — whole number, used for ranking (lower is better) */
  ips_7d: number
  /** IPS over the last 30 days — whole number, optional */
  ips_30d: number | null
  updated_at: string
  updated_by: string | null
}

/** Mirrors public.dashboard_settings (singleton row, id = 1) */
export interface DashboardSettings {
  id: 1
  announcement: string
  /** Monday of the week shown on the TV, YYYY-MM-DD */
  display_week_start: string
  updated_at: string
  updated_by: string | null
}

export type Role = 'admin' | 'viewer'

export interface RankedRunner {
  id: string
  name: string
  ips7d: number
  ips30d: number | null
  /** Standard competition rank (1, 2, 2, 4) — equal 7-day IPS share a rank */
  rank: number
  tied: boolean
}

export interface LeaderboardData {
  weekStart: string
  entries: RankedRunner[]
  activeRunnerCount: number
  measuredRunnerCount: number
  announcement: string
  /** Most recent change affecting what the TV shows */
  lastUpdated: string | null
}

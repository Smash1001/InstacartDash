// Prototype backend: sample data kept in localStorage so the admin panel and
// TV dashboard stay in sync across browser tabs. Replaced by Supabase later.
import type { DashboardSettings, Runner, WeeklyPerformance } from '../types'
import { addWeeks, getWeekStart } from '../lib/week'
import type { DataBackend } from './backend'

const STORAGE_KEY = 'runner-leaderboard-demo-v1'

interface DemoDB {
  runners: Runner[]
  performance: WeeklyPerformance[]
  settings: DashboardSettings
}

const SAMPLE_NAMES = [
  'Maria Gonzalez', 'James Carter', 'Aisha Patel', 'Devon Brooks',
  'Lily Chen', 'Marcus Johnson', 'Sofia Rossi', 'Tyler Nguyen',
  'Grace Kim', 'Omar Haddad', 'Hannah Lee', 'Ethan Walker',
]
// Last-week and this-week sample averages; null = not entered yet.
const SAMPLE_LAST = [4.1, 4.62, 3.88, 5.2, 4.35, 4.9, 3.95, 5.6, 4.4, 4.75, 5.05, 4.2]
const SAMPLE_THIS = [3.92, 4.48, 3.71, 4.95, 4.48, null, 4.05, 5.12, 4.21, null, 4.88, null]

const now = () => new Date().toISOString()

function seed(): DemoDB {
  const thisWeek = getWeekStart()
  const lastWeek = addWeeks(thisWeek, -1)
  const runners: Runner[] = SAMPLE_NAMES.map((name) => ({
    id: crypto.randomUUID(),
    name,
    is_active: true,
    created_at: now(),
  }))
  const performance: WeeklyPerformance[] = []
  runners.forEach((r, i) => {
    for (const [week, values] of [[lastWeek, SAMPLE_LAST], [thisWeek, SAMPLE_THIS]] as const) {
      const v = values[i]
      if (v != null) {
        performance.push({
          id: crypto.randomUUID(),
          runner_id: r.id,
          week_start: week,
          avg_seconds_per_item: v,
          updated_at: now(),
          updated_by: null,
        })
      }
    }
  })
  return {
    runners,
    performance,
    settings: {
      id: 1,
      announcement:
        'Great hustle this week, team! Remember to double-check produce quality before bagging. 🥕',
      display_week_start: thisWeek,
      updated_at: now(),
      updated_by: null,
    },
  }
}

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DemoDB
  } catch {
    // fall through to a fresh seed
  }
  const db = seed()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  return db
}

let db = load()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

function commit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  notify()
}

// Other tabs (e.g. admin panel) wrote to storage — reload and notify.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    db = load()
    notify()
  }
})

const clone = <T,>(v: T): T => structuredClone(v)

export const demoBackend: DataBackend = {
  async listRunners() {
    return clone(db.runners)
  },

  async createRunner(name) {
    const runner: Runner = { id: crypto.randomUUID(), name, is_active: true, created_at: now() }
    db.runners.push(runner)
    commit()
    return clone(runner)
  },

  async updateRunner(id, patch) {
    const runner = db.runners.find((r) => r.id === id)
    if (!runner) throw new Error('Runner not found')
    Object.assign(runner, patch)
    commit()
    return clone(runner)
  },

  async listPerformance(weekStart) {
    return clone(db.performance.filter((p) => p.week_start === weekStart))
  },

  async upsertPerformance(runnerId, weekStart, avg) {
    let row = db.performance.find((p) => p.runner_id === runnerId && p.week_start === weekStart)
    if (row) {
      row.avg_seconds_per_item = avg
      row.updated_at = now()
    } else {
      row = {
        id: crypto.randomUUID(),
        runner_id: runnerId,
        week_start: weekStart,
        avg_seconds_per_item: avg,
        updated_at: now(),
        updated_by: null,
      }
      db.performance.push(row)
    }
    commit()
    return clone(row)
  },

  async deletePerformance(runnerId, weekStart) {
    db.performance = db.performance.filter(
      (p) => !(p.runner_id === runnerId && p.week_start === weekStart),
    )
    commit()
  },

  async getSettings() {
    return clone(db.settings)
  },

  async updateSettings(patch) {
    Object.assign(db.settings, patch, { updated_at: now() })
    commit()
    return clone(db.settings)
  },

  subscribe(onChange, onStatus) {
    listeners.add(onChange)
    onStatus('live')
    return () => listeners.delete(onChange)
  },
}

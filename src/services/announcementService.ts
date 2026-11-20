import type { DashboardSettings } from '../types'
import { isMonday } from '../lib/week'
import { backend } from './backend'

export const MAX_ANNOUNCEMENT_LENGTH = 280

export function getDashboardSettings(): Promise<DashboardSettings> {
  return backend.getSettings()
}

export function saveAnnouncement(text: string): Promise<DashboardSettings> {
  const announcement = text.trim()
  if (announcement.length > MAX_ANNOUNCEMENT_LENGTH) {
    throw new Error(`Keep it to ${MAX_ANNOUNCEMENT_LENGTH} characters so it fits on the TV.`)
  }
  return backend.updateSettings({ announcement })
}

/** Choose which week the TV leaderboard shows. */
export function setDisplayWeek(weekStart: string): Promise<DashboardSettings> {
  if (!isMonday(weekStart)) throw new Error('Week must start on a Monday.')
  return backend.updateSettings({ display_week_start: weekStart })
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DashboardSettings, Runner, WeeklyPerformance } from '../types'
import { errorMessage } from '../lib/ui'
import { formatWeekRange, getWeekStart } from '../lib/week'
import {
  MAX_ANNOUNCEMENT_LENGTH,
  getDashboardSettings,
  saveAnnouncement,
  setDisplayWeek,
} from '../services/announcementService'
import { clearIps, listPerformanceForWeek, parseIps, saveIps } from '../services/performanceService'
import { createRunner, listRunners, updateRunner, validateRunnerName } from '../services/runnerService'
import type { NoticeState } from '../components/ui'

export interface RunnerDraft {
  name: string
  isActive: boolean
  ips7: string
  ips30: string
}

export interface NewRunnerDraft {
  key: string
  name: string
  ips7: string
  ips30: string
}

export type FieldErrors = Record<string, string>
export const fieldKey = (rowKey: string, field: 'name' | 'ips7' | 'ips30') => `${rowKey}:${field}`

/** "042" and "42" are the same value; anything non-numeric is compared as typed. */
const normalizeIps = (s: string) => {
  const t = s.trim()
  return /^\d+$/.test(t) ? String(Number(t)) : t
}

function baselineFor(r: Runner, rec: WeeklyPerformance | undefined): RunnerDraft {
  return {
    name: r.name,
    isActive: r.is_active,
    ips7: rec ? String(rec.ips_7d) : '',
    ips30: rec?.ips_30d != null ? String(rec.ips_30d) : '',
  }
}

const isBlankNewRow = (n: NewRunnerDraft) => !n.name.trim() && !n.ips7.trim() && !n.ips30.trim()

/**
 * All state for the single-page admin editor. Every edit is staged locally
 * and written in one go by saveAll().
 */
export function useAdminEditor() {
  const [week, setWeek] = useState(getWeekStart)
  const [runners, setRunners] = useState<Runner[]>([])
  const [records, setRecords] = useState<Map<string, WeeklyPerformance>>(new Map())
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [drafts, setDrafts] = useState<Record<string, RunnerDraft>>({})
  const [newRows, setNewRows] = useState<NewRunnerDraft[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const load = useCallback(async (weekStart: string) => {
    setLoading(true)
    try {
      const [rs, perf, s] = await Promise.all([
        listRunners(),
        listPerformanceForWeek(weekStart),
        getDashboardSettings(),
      ])
      const byRunner = new Map(perf.map((p) => [p.runner_id, p]))
      setRunners(rs)
      setRecords(byRunner)
      setSettings(s)
      setDrafts(Object.fromEntries(rs.map((r) => [r.id, baselineFor(r, byRunner.get(r.id))])))
      setNewRows([])
      setAnnouncement(s.announcement)
      setErrors({})
    } catch (e) {
      setNotice({ kind: 'error', text: `Could not load data: ${errorMessage(e)}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(week)
  }, [load, week])

  // ---- change tracking ------------------------------------------------

  const runnerChanges = useMemo(() => {
    return runners.map((r) => {
      const d = drafts[r.id] ?? baselineFor(r, records.get(r.id))
      const base = baselineFor(r, records.get(r.id))
      return {
        runner: r,
        draft: d,
        nameChanged: d.name.trim() !== base.name,
        activeChanged: d.isActive !== base.isActive,
        ipsChanged:
          normalizeIps(d.ips7) !== normalizeIps(base.ips7) ||
          normalizeIps(d.ips30) !== normalizeIps(base.ips30),
      }
    })
  }, [runners, drafts, records])

  const pendingNewRows = newRows.filter((n) => !isBlankNewRow(n))
  const announcementChanged = settings !== null && announcement.trim() !== settings.announcement

  const changeCount =
    runnerChanges.reduce(
      (n, c) => n + Number(c.nameChanged) + Number(c.activeChanged) + Number(c.ipsChanged),
      0,
    ) +
    pendingNewRows.length +
    Number(announcementChanged)

  const isRunnerDirty = (id: string) => {
    const c = runnerChanges.find((x) => x.runner.id === id)
    return !!c && (c.nameChanged || c.activeChanged || c.ipsChanged)
  }

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!changeCount) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [changeCount])

  // ---- editing actions ------------------------------------------------

  const clearError = (key: string) =>
    setErrors((errs) => (errs[key] ? { ...errs, [key]: '' } : errs))

  function setDraft(id: string, patch: Partial<RunnerDraft>) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }))
    for (const f of Object.keys(patch)) {
      if (f !== 'isActive') clearError(fieldKey(id, f as 'name' | 'ips7' | 'ips30'))
    }
  }

  function addNewRow() {
    setNewRows((rows) => [...rows, { key: crypto.randomUUID(), name: '', ips7: '', ips30: '' }])
  }

  function updateNewRow(key: string, patch: Partial<NewRunnerDraft>) {
    setNewRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    for (const f of Object.keys(patch)) clearError(fieldKey(key, f as 'name' | 'ips7' | 'ips30'))
  }

  function removeNewRow(key: string) {
    setNewRows((rows) => rows.filter((r) => r.key !== key))
  }

  function changeWeek(next: string) {
    if (next === week) return
    if (changeCount && !confirm('You have unsaved changes. Discard them and switch weeks?')) return
    setNotice(null)
    setWeek(next)
  }

  function discard() {
    setNotice(null)
    load(week)
  }

  async function showOnTv() {
    try {
      setSettings(await setDisplayWeek(week))
      setNotice({ kind: 'success', text: `The TV now shows the week of ${formatWeekRange(week)}.` })
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) })
    }
  }

  // ---- save -----------------------------------------------------------

  /** Validate one row's IPS pair. Returns parsed values or records errors. */
  function parseIpsPair(rowKey: string, ips7: string, ips30: string, errs: FieldErrors) {
    let v7: number | null = null
    let v30: number | null = null
    try {
      v7 = parseIps(ips7)
    } catch (e) {
      errs[fieldKey(rowKey, 'ips7')] = errorMessage(e)
    }
    try {
      v30 = parseIps(ips30)
    } catch (e) {
      errs[fieldKey(rowKey, 'ips30')] = errorMessage(e)
    }
    if (v7 === null && v30 !== null && !errs[fieldKey(rowKey, 'ips7')]) {
      errs[fieldKey(rowKey, 'ips7')] = 'Required when 30-day is entered.'
    }
    return { v7, v30 }
  }

  async function saveAll() {
    setNotice(null)
    const errs: FieldErrors = {}
    const tasks: (() => Promise<unknown>)[] = []
    let clearing = 0

    // Existing runners
    for (const c of runnerChanges) {
      const { runner: r, draft: d } = c
      if (c.nameChanged || c.activeChanged) {
        let name: string | undefined
        if (c.nameChanged) {
          try {
            name = validateRunnerName(d.name)
          } catch (e) {
            errs[fieldKey(r.id, 'name')] = errorMessage(e)
          }
        }
        tasks.push(() =>
          updateRunner(r.id, {
            ...(name !== undefined && { name }),
            ...(c.activeChanged && { is_active: d.isActive }),
          }),
        )
      }
      if (c.ipsChanged) {
        const { v7, v30 } = parseIpsPair(r.id, d.ips7, d.ips30, errs)
        if (v7 !== null) tasks.push(() => saveIps(r.id, week, v7, v30))
        else if (v30 === null && records.has(r.id)) {
          clearing++
          tasks.push(() => clearIps(r.id, week))
        }
      }
    }

    // New runners: create, then save their IPS
    for (const n of pendingNewRows) {
      let name = ''
      try {
        name = validateRunnerName(n.name)
      } catch (e) {
        errs[fieldKey(n.key, 'name')] = errorMessage(e)
      }
      const { v7, v30 } = parseIpsPair(n.key, n.ips7, n.ips30, errs)
      tasks.push(async () => {
        const created = await createRunner(name)
        if (v7 !== null) await saveIps(created.id, week, v7, v30)
      })
    }

    // Announcement
    if (announcementChanged) {
      if (announcement.trim().length > MAX_ANNOUNCEMENT_LENGTH) {
        errs.announcement = `Keep it to ${MAX_ANNOUNCEMENT_LENGTH} characters so it fits on the TV.`
      }
      tasks.push(() => saveAnnouncement(announcement))
    }

    setErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      setNotice({ kind: 'error', text: 'Fix the highlighted fields before saving.' })
      return
    }
    if (!tasks.length) return
    if (clearing && !confirm(`Remove ${clearing} saved IPS entr${clearing > 1 ? 'ies' : 'y'} for this week?`)) {
      return
    }

    setSaving(true)
    const results = await Promise.allSettled(tasks.map((t) => t()))
    setSaving(false)
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    await load(week)
    setNotice(
      failures.length
        ? {
            kind: 'error',
            text: `${failures.length} of ${results.length} change(s) failed: ${errorMessage(failures[0].reason)}`,
          }
        : { kind: 'success', text: 'All changes saved. The TV will update automatically.' },
    )
  }

  return {
    week,
    changeWeek,
    runners,
    records,
    settings,
    drafts,
    setDraft,
    newRows,
    addNewRow,
    updateNewRow,
    removeNewRow,
    announcement,
    setAnnouncement,
    errors,
    loading,
    saving,
    notice,
    changeCount,
    isRunnerDirty,
    saveAll,
    discard,
    showOnTv,
  }
}
